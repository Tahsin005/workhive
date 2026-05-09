package services

import (
	"errors"
	"sync"

	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/Tahsin005/workhive-backend/internal/repository"
	"github.com/google/uuid"
)

type AdminUserStats struct {
	TotalJobs      int64
	TotalBids      int64
	TotalContracts int64
}

type AdminStats struct {
	TotalUsers         int64
	TotalClients       int64
	TotalFreelancers   int64
	TotalJobs          int64
	OpenJobs           int64
	TotalContracts     int64
	ActiveContracts    int64
	CompletedContracts int64
	TotalRevenue       float64
	PendingRevenue     float64
}

type AdminService interface {
	ListUsers(filters repository.AdminUserFilters, page int, limit int) ([]models.User, int64, error)
	GetUser(id uuid.UUID) (*models.User, *AdminUserStats, error)
	BanUser(adminID uuid.UUID, targetID uuid.UUID) (*models.User, error)
	DeleteUser(adminID uuid.UUID, targetID uuid.UUID) error
	ListJobs(filters repository.AdminJobFilters, page int, limit int) ([]models.Job, int64, error)
	CountBidsForJob(jobID uuid.UUID) (int64, error)
	DeleteJob(id uuid.UUID) error
	GetStats() (*AdminStats, error)
	PromoteToAdmin(email string) (*models.User, error)
}

type adminService struct {
	adminRepo repository.AdminRepository
	userRepo  repository.UserRepository
	jobRepo   repository.JobRepository
}

func NewAdminService(adminRepo repository.AdminRepository, userRepo repository.UserRepository, jobRepo repository.JobRepository) AdminService {
	return &adminService{adminRepo, userRepo, jobRepo}
}

func (s *adminService) ListUsers(filters repository.AdminUserFilters, page int, limit int) ([]models.User, int64, error) {
	offset := (page - 1) * limit
	users, err := s.adminRepo.ListUsers(filters, offset, limit)
	if err != nil {
		return nil, 0, err
	}
	total, err := s.adminRepo.CountUsers(filters)
	return users, total, err
}

func (s *adminService) GetUser(id uuid.UUID) (*models.User, *AdminUserStats, error) {
	user, err := s.adminRepo.FindUserByIDUnscoped(id)
	if err != nil {
		return nil, nil, errors.New("user not found")
	}

	var stats AdminUserStats
	var wg sync.WaitGroup
	var errJobs, errBids, errContracts error

	wg.Add(3)
	go func() {
		defer wg.Done()
		stats.TotalJobs, errJobs = s.adminRepo.CountUserJobs(id)
	}()
	go func() {
		defer wg.Done()
		stats.TotalBids, errBids = s.adminRepo.CountUserBids(id)
	}()
	go func() {
		defer wg.Done()
		stats.TotalContracts, errContracts = s.adminRepo.CountUserContracts(id)
	}()
	wg.Wait()

	if errJobs != nil {
		return nil, nil, errJobs
	}
	if errBids != nil {
		return nil, nil, errBids
	}
	if errContracts != nil {
		return nil, nil, errContracts
	}

	return user, &stats, nil
}

func (s *adminService) BanUser(adminID uuid.UUID, targetID uuid.UUID) (*models.User, error) {
	if adminID == targetID {
		return nil, errors.New("cannot ban yourself")
	}

	user, err := s.userRepo.FindByID(targetID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Role == models.RoleAdmin {
		return nil, errors.New("cannot ban an admin")
	}

	user.IsActive = !user.IsActive
	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *adminService) DeleteUser(adminID uuid.UUID, targetID uuid.UUID) error {
	if adminID == targetID {
		return errors.New("cannot delete yourself")
	}

	user, err := s.userRepo.FindByID(targetID)
	if err != nil {
		return errors.New("user not found")
	}

	if user.Role == models.RoleAdmin {
		return errors.New("cannot delete an admin")
	}

	hasActive, err := s.adminRepo.HasActiveContracts(targetID)
	if err != nil {
		return err
	}
	if hasActive {
		return errors.New("cannot delete user with active contracts")
	}

	return s.userRepo.Delete(user)
}

func (s *adminService) ListJobs(filters repository.AdminJobFilters, page int, limit int) ([]models.Job, int64, error) {
	offset := (page - 1) * limit
	jobs, err := s.adminRepo.ListJobs(filters, offset, limit)
	if err != nil {
		return nil, 0, err
	}

	total, err := s.adminRepo.CountJobs(filters)
	return jobs, total, err
}

func (s *adminService) CountBidsForJob(jobID uuid.UUID) (int64, error) {
	return s.adminRepo.CountBidsForJob(jobID)
}

func (s *adminService) DeleteJob(id uuid.UUID) error {
	_, err := s.jobRepo.GetByID(id.String())
	if err != nil {
		return errors.New("job not found")
	}

	hasActive, err := s.adminRepo.HasActiveContractForJob(id)
	if err != nil {
		return err
	}
	if hasActive {
		return errors.New("cannot delete job with active contract")
	}

	return s.jobRepo.Delete(id.String())
}

func (s *adminService) PromoteToAdmin(email string) (*models.User, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Role == models.RoleAdmin {
		return nil, errors.New("user is already an admin")
	}

	if err := s.userRepo.UpdateRole(email, models.RoleAdmin); err != nil {
		return nil, err
	}

	user.Role = models.RoleAdmin
	return user, nil
}

func (s *adminService) GetStats() (*AdminStats, error) {
	var stats AdminStats
	var errs []error
	var mu sync.Mutex

	recordError := func(err error) {
		if err != nil {
			mu.Lock()
			errs = append(errs, err)
			mu.Unlock()
		}
	}

	var wg sync.WaitGroup
	wg.Add(10)

	go func() {
		defer wg.Done()
		val, err := s.adminRepo.CountAllUsers()
		recordError(err)
		stats.TotalUsers = val
	}()
	go func() {
		defer wg.Done()
		val, err := s.adminRepo.CountUsersByRole(string(models.RoleClient))
		recordError(err)
		stats.TotalClients = val
	}()
	go func() {
		defer wg.Done()
		val, err := s.adminRepo.CountUsersByRole(string(models.RoleFreelancer))
		recordError(err)
		stats.TotalFreelancers = val
	}()
	go func() {
		defer wg.Done()
		val, err := s.adminRepo.CountAllJobs()
		recordError(err)
		stats.TotalJobs = val
	}()
	go func() {
		defer wg.Done()
		val, err := s.adminRepo.CountJobsByStatus(string(models.JobStatusOpen))
		recordError(err)
		stats.OpenJobs = val
	}()
	go func() {
		defer wg.Done()
		val, err := s.adminRepo.CountAllContracts()
		recordError(err)
		stats.TotalContracts = val
	}()
	go func() {
		defer wg.Done()
		val, err := s.adminRepo.CountContractsByStatus(string(models.ContractStatusActive))
		recordError(err)
		stats.ActiveContracts = val
	}()
	go func() {
		defer wg.Done()
		val, err := s.adminRepo.CountContractsByStatus(string(models.ContractStatusCompleted))
		recordError(err)
		stats.CompletedContracts = val
	}()
	go func() {
		defer wg.Done()
		val, err := s.adminRepo.SumPaymentsByStatus(string(models.PaymentStatusPaid))
		recordError(err)
		stats.TotalRevenue = val
	}()
	go func() {
		defer wg.Done()
		val, err := s.adminRepo.SumPaymentsByStatus(string(models.PaymentStatusPending))
		recordError(err)
		stats.PendingRevenue = val
	}()

	wg.Wait()

	if len(errs) > 0 {
		return nil, errs[0] // Return first error
	}

	return &stats, nil
}
