package services

import (
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/Tahsin005/workhive-backend/internal/config"
	"github.com/Tahsin005/workhive-backend/internal/dto"
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v81"
	"github.com/stripe/stripe-go/v81/paymentintent"
	"github.com/stripe/stripe-go/v81/webhook"
	"gorm.io/gorm"
)

type PaymentService interface {
	CreateIntent(userID uuid.UUID, input models.CreatePaymentIntentInput) (*dto.PaymentIntentResponse, error)
	HandleWebhook(rawBody []byte, signature string) error
	GetByContractID(userID uuid.UUID, contractID uuid.UUID) ([]models.Payment, error)
	ListMyPayments(userID uuid.UUID, page, limit int) ([]models.Payment, int64, error)
}

type paymentService struct {
	paymentRepo  repository.PaymentRepository
	contractRepo repository.ContractRepository
	jobRepo      repository.JobRepository
	cfg          *config.Config
	db           *gorm.DB
}

func NewPaymentService(paymentRepo repository.PaymentRepository, contractRepo repository.ContractRepository, jobRepo repository.JobRepository, cfg *config.Config, db *gorm.DB) PaymentService {
	stripe.Key = cfg.StripeSecret
	return &paymentService{
		paymentRepo:  paymentRepo,
		contractRepo: contractRepo,
		jobRepo:      jobRepo,
		cfg:          cfg,
		db:           db,
	}
}

func (s *paymentService) CreateIntent(userID uuid.UUID, input models.CreatePaymentIntentInput) (*dto.PaymentIntentResponse, error) {
	contractID, err := uuid.Parse(input.ContractID)
	if err != nil {
		return nil, errors.New("invalid contract ID")
	}

	var response *dto.PaymentIntentResponse
	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Use transaction-aware repositories
		txContractRepo := s.contractRepo
		txPaymentRepo := s.paymentRepo.WithTx(tx)

		// Lock the contract record to prevent concurrent intent creation
		contract, err := txContractRepo.GetByIDForUpdate(tx, contractID.String())
		if err != nil {
			return errors.New("contract not found")
		}

		if contract.ClientID != userID {
			return errors.New("unauthorized")
		}

		if contract.Status != models.ContractStatusActive {
			return errors.New("contract is not active")
		}

		// Check for existing payments within the same transaction
		payments, err := txPaymentRepo.FindByContractID(contractID)
		if err != nil {
			return err
		}

		var pendingPayment *models.Payment
		for _, p := range payments {
			if p.Status == models.PaymentStatusPaid {
				return errors.New("this contract has already been paid")
			}
			if p.Status == models.PaymentStatusPending {
				pendingPayment = &p
			}
		}

		// Reuse existing pending payment if it has Stripe data
		if pendingPayment != nil && pendingPayment.StripePaymentID != nil && pendingPayment.ClientSecret != nil {
			// Verify actual status with Stripe to avoid "Terminal State" errors on frontend
			intent, err := paymentintent.Get(*pendingPayment.StripePaymentID, nil)
			if err == nil {
				if intent.Status == stripe.PaymentIntentStatusSucceeded {
					return errors.New("this contract has already been paid")
				}
				if intent.Status == stripe.PaymentIntentStatusCanceled {
					// If canceled, we should ignore this record and create a new one
					pendingPayment = nil
				} else {
					response = &dto.PaymentIntentResponse{
						ClientSecret: *pendingPayment.ClientSecret,
						PaymentID:    pendingPayment.ID,
						Amount:       pendingPayment.Amount,
						Currency:     "usd",
					}
					return nil
				}
			}
		}

		// Create a new Stripe Payment Intent with an idempotency key
		idempotencyKey := "pi_" + contract.ID.String()
		params := &stripe.PaymentIntentParams{
			Params: stripe.Params{
				IdempotencyKey: stripe.String(idempotencyKey),
			},
			Amount:   stripe.Int64(int64(contract.Amount * 100)),
			Currency: stripe.String(string(stripe.CurrencyUSD)),
			AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
				Enabled:        stripe.Bool(true),
				AllowRedirects: stripe.String("never"),
			},
			Metadata: map[string]string{
				"contract_id": contract.ID.String(),
				"payer_id":    userID.String(),
			},
		}

		intent, err := paymentintent.New(params)
		if err != nil {
			return err
		}

		payment := &models.Payment{
			ContractID:      contract.ID,
			PayerID:         userID,
			Amount:          contract.Amount,
			StripePaymentID: &intent.ID,
			ClientSecret:    &intent.ClientSecret,
			Status:          models.PaymentStatusPending,
		}

		if err := txPaymentRepo.Create(payment); err != nil {
			return err
		}

		response = &dto.PaymentIntentResponse{
			ClientSecret: intent.ClientSecret,
			PaymentID:    payment.ID,
			Amount:       contract.Amount,
			Currency:     "usd",
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return response, nil
}

func (s *paymentService) HandleWebhook(rawBody []byte, signature string) error {

	event, err := webhook.ConstructEventWithOptions(
		rawBody,
		signature,
		s.cfg.StripeWebhookSecret,
		webhook.ConstructEventOptions{
			IgnoreAPIVersionMismatch: true,
		},
	)
	if err != nil {
		return errors.New("invalid webhook signature: " + err.Error())
	}

	switch event.Type {
	case "payment_intent.succeeded":
		var intent stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &intent); err != nil {
			log.Printf("Error parsing webhook JSON: %v\n", err)
			return err
		}

		payment, err := s.paymentRepo.FindByStripePaymentID(intent.ID)
		if err != nil {
			log.Printf("Payment record not found for Stripe ID %s\n", intent.ID)
			return nil // Return 200 to Stripe
		}

		now := time.Now()
		payment.Status = models.PaymentStatusPaid
		payment.PaidAt = &now
		if err := s.paymentRepo.Update(payment); err != nil {
			return err
		}

		contract, err := s.contractRepo.GetByID(payment.ContractID.String())
		if err == nil {
			contract.Status = models.ContractStatusCompleted
			contract.CompletedAt = &now
			s.contractRepo.Update(contract)

			job, err := s.jobRepo.GetByID(contract.JobID.String())
			if err == nil {
				job.Status = models.JobStatusCompleted
				s.jobRepo.Update(job)
			}
		}

	case "payment_intent.payment_failed":
		var intent stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &intent); err != nil {
			log.Printf("Error parsing webhook JSON: %v\n", err)
			return err
		}

		payment, err := s.paymentRepo.FindByStripePaymentID(intent.ID)
		if err != nil {
			log.Printf("Payment record not found for Stripe ID %s\n", intent.ID)
			return nil
		}

		payment.Status = models.PaymentStatusFailed
		s.paymentRepo.Update(payment)

	default:
		log.Printf("Unhandled event type: %s\n", event.Type)
	}

	return nil
}

func (s *paymentService) GetByContractID(userID uuid.UUID, contractID uuid.UUID) ([]models.Payment, error) {
	contract, err := s.contractRepo.GetByID(contractID.String())
	if err != nil {
		return nil, errors.New("contract not found")
	}

	if contract.ClientID != userID && contract.FreelancerID != userID {
		return nil, errors.New("unauthorized")
	}

	return s.paymentRepo.FindByContractID(contractID)
}

func (s *paymentService) ListMyPayments(userID uuid.UUID, page, limit int) ([]models.Payment, int64, error) {
	offset := (page - 1) * limit
	payments, err := s.paymentRepo.FindByUserID(userID, offset, limit)
	if err != nil {
		return nil, 0, err
	}

	total, err := s.paymentRepo.CountByUserID(userID)
	if err != nil {
		return nil, 0, err
	}

	return payments, total, nil
}
