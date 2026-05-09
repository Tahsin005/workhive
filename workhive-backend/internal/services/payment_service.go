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
)

type PaymentService interface {
	CreateIntent(userID uuid.UUID, input models.CreatePaymentIntentInput) (*dto.PaymentIntentResponse, error)
	HandleWebhook(rawBody []byte, signature string) error
	GetByContractID(userID uuid.UUID, contractID uuid.UUID) ([]models.Payment, error)
}

type paymentService struct {
	paymentRepo  repository.PaymentRepository
	contractRepo repository.ContractRepository
	jobRepo      repository.JobRepository
	cfg          *config.Config
}

func NewPaymentService(paymentRepo repository.PaymentRepository, contractRepo repository.ContractRepository, jobRepo repository.JobRepository, cfg *config.Config) PaymentService {
	stripe.Key = cfg.StripeSecret
	return &paymentService{
		paymentRepo:  paymentRepo,
		contractRepo: contractRepo,
		jobRepo:      jobRepo,
		cfg:          cfg,
	}
}

func (s *paymentService) CreateIntent(userID uuid.UUID, input models.CreatePaymentIntentInput) (*dto.PaymentIntentResponse, error) {
	contractID, err := uuid.Parse(input.ContractID)
	if err != nil {
		return nil, errors.New("invalid contract ID")
	}

	contract, err := s.contractRepo.GetByID(contractID.String())
	if err != nil {
		return nil, errors.New("contract not found")
	}

	if contract.ClientID != userID {
		return nil, errors.New("unauthorized")
	}

	if contract.Status != models.ContractStatusActive {
		return nil, errors.New("contract is not active")
	}

	hasActive, err := s.paymentRepo.HasActivePayment(contractID)
	if err != nil {
		return nil, err
	}
	if hasActive {
		return nil, errors.New("a pending or paid payment already exists for this contract")
	}

	params := &stripe.PaymentIntentParams{
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
		return nil, err
	}

	payment := &models.Payment{
		ContractID:      contract.ID,
		PayerID:         userID,
		Amount:          contract.Amount,
		StripePaymentID: &intent.ID,
		Status:          models.PaymentStatusPending,
	}

	if err := s.paymentRepo.Create(payment); err != nil {
		return nil, err
	}

	return &dto.PaymentIntentResponse{
		ClientSecret: intent.ClientSecret,
		PaymentID:    payment.ID,
		Amount:       contract.Amount,
		Currency:     "usd",
	}, nil
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
