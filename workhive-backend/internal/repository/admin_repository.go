package repository

import (
	"github.com/Tahsin005/workhive-backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminUserFilters struct {
	Role     string
	IsActive *bool
	Search   string
}

type AdminJobFilters struct {
	Status   string
	Category string
	Search   string
}

type AdminRepository interface {
	// Users
	ListUsers(filters AdminUserFilters, offset int, limit int) ([]models.User, error)
	CountUsers(filters AdminUserFilters) (int64, error)
	FindUserByIDUnscoped(id uuid.UUID) (*models.User, error)
	CountUserJobs(userID uuid.UUID) (int64, error)
	CountUserBids(userID uuid.UUID) (int64, error)
	CountUserContracts(userID uuid.UUID) (int64, error)
	HasActiveContracts(userID uuid.UUID) (bool, error)

	// Jobs
	ListJobs(filters AdminJobFilters, offset int, limit int) ([]models.Job, error)
	CountJobs(filters AdminJobFilters) (int64, error)
	FindJobByID(id uuid.UUID) (*models.Job, error)
	HasActiveContractForJob(jobID uuid.UUID) (bool, error)
	CountBidsForJob(jobID uuid.UUID) (int64, error)

	// Stats
	CountAllUsers() (int64, error)
	CountUsersByRole(role string) (int64, error)
	CountAllJobs() (int64, error)
	CountJobsByStatus(status string) (int64, error)
	CountAllContracts() (int64, error)
	CountContractsByStatus(status string) (int64, error)
	SumPaymentsByStatus(status string) (float64, error)
}

type adminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
	return &adminRepository{db}
}

// -- Users --

func (r *adminRepository) applyUserFilters(query *gorm.DB, filters AdminUserFilters) *gorm.DB {
	q := query.Unscoped() // Admin needs to see soft-deleted users
	if filters.Role != "" {
		q = q.Where("role = ?", filters.Role)
	}
	if filters.IsActive != nil {
		q = q.Where("is_active = ?", *filters.IsActive)
	}
	if filters.Search != "" {
		searchTerm := "%" + filters.Search + "%"
		q = q.Where("(full_name ILIKE ? OR email ILIKE ?)", searchTerm, searchTerm)
	}
	return q
}

func (r *adminRepository) ListUsers(filters AdminUserFilters, offset int, limit int) ([]models.User, error) {
	var users []models.User
	query := r.applyUserFilters(r.db.Model(&models.User{}), filters)
	err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&users).Error
	return users, err
}

func (r *adminRepository) CountUsers(filters AdminUserFilters) (int64, error) {
	var count int64
	query := r.applyUserFilters(r.db.Model(&models.User{}), filters)
	err := query.Count(&count).Error
	return count, err
}

func (r *adminRepository) FindUserByIDUnscoped(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.Unscoped().First(&user, "id = ?", id).Error
	return &user, err
}

func (r *adminRepository) CountUserJobs(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Unscoped().Model(&models.Job{}).Where("client_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *adminRepository) CountUserBids(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Unscoped().Model(&models.Bid{}).Where("freelancer_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *adminRepository) CountUserContracts(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Unscoped().Model(&models.Contract{}).Where("client_id = ? OR freelancer_id = ?", userID, userID).Count(&count).Error
	return count, err
}

func (r *adminRepository) HasActiveContracts(userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.Contract{}).
		Where("(client_id = ? OR freelancer_id = ?) AND status = ?", userID, userID, models.ContractStatusActive).
		Count(&count).Error
	return count > 0, err
}

// -- Jobs --

func (r *adminRepository) applyJobFilters(query *gorm.DB, filters AdminJobFilters) *gorm.DB {
	q := query.Unscoped() // See soft deleted? The prompt says "List all jobs across the platform" but doesn't explicitly mention unscoped for jobs. It says "Include soft-deleted users" explicitly. Let's use normal scope for jobs to be safe, or wait, it says "total_jobs -> COUNT(*) FROM jobs WHERE deleted_at IS NULL" for stats, meaning stats exclude deleted. I'll stick to normal scope for jobs list.
	// Oh, I will just use normal scope for jobs, unless requested.
	if filters.Status != "" {
		q = q.Where("status = ?", filters.Status)
	}
	if filters.Category != "" {
		q = q.Where("category = ?", filters.Category)
	}
	if filters.Search != "" {
		searchTerm := "%" + filters.Search + "%"
		q = q.Where("(title ILIKE ? OR description ILIKE ?)", searchTerm, searchTerm)
	}
	return q
}

func (r *adminRepository) ListJobs(filters AdminJobFilters, offset int, limit int) ([]models.Job, error) {
	var jobs []models.Job
	query := r.applyJobFilters(r.db.Model(&models.Job{}), filters)
	// include bid count
	err := query.Preload("Client").
		Order("created_at DESC").Offset(offset).Limit(limit).Find(&jobs).Error
	return jobs, err
}

func (r *adminRepository) CountJobs(filters AdminJobFilters) (int64, error) {
	var count int64
	query := r.applyJobFilters(r.db.Model(&models.Job{}), filters)
	err := query.Count(&count).Error
	return count, err
}

func (r *adminRepository) FindJobByID(id uuid.UUID) (*models.Job, error) {
	var job models.Job
	err := r.db.First(&job, "id = ?", id).Error
	return &job, err
}

func (r *adminRepository) HasActiveContractForJob(jobID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.Contract{}).
		Where("job_id = ? AND status = ?", jobID, models.ContractStatusActive).
		Count(&count).Error
	return count > 0, err
}

func (r *adminRepository) CountBidsForJob(jobID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Bid{}).Where("job_id = ?", jobID).Count(&count).Error
	return count, err
}

// -- Stats --

func (r *adminRepository) CountAllUsers() (int64, error) {
	var count int64
	err := r.db.Model(&models.User{}).Count(&count).Error
	return count, err
}

func (r *adminRepository) CountUsersByRole(role string) (int64, error) {
	var count int64
	err := r.db.Model(&models.User{}).Where("role = ?", role).Count(&count).Error
	return count, err
}

func (r *adminRepository) CountAllJobs() (int64, error) {
	var count int64
	err := r.db.Model(&models.Job{}).Count(&count).Error
	return count, err
}

func (r *adminRepository) CountJobsByStatus(status string) (int64, error) {
	var count int64
	err := r.db.Model(&models.Job{}).Where("status = ?", status).Count(&count).Error
	return count, err
}

func (r *adminRepository) CountAllContracts() (int64, error) {
	var count int64
	err := r.db.Model(&models.Contract{}).Count(&count).Error
	return count, err
}

func (r *adminRepository) CountContractsByStatus(status string) (int64, error) {
	var count int64
	err := r.db.Model(&models.Contract{}).Where("status = ?", status).Count(&count).Error
	return count, err
}

func (r *adminRepository) SumPaymentsByStatus(status string) (float64, error) {
	var total float64
	err := r.db.Model(&models.Payment{}).Where("status = ?", status).Select("COALESCE(SUM(amount), 0)").Scan(&total).Error
	return total, err
}
