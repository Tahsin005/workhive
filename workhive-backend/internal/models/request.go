package models

// auth
type RegisterInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Role     Role   `json:"role" validate:"required,oneof=client freelancer"`
}

type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type UpdateProfileInput struct {
	FullName string  `json:"full_name" validate:"omitempty,min=2,max=100"`
	Bio      *string `json:"bio" validate:"omitempty,max=500"`
}

type ChangePasswordInput struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=6"`
}

// jobs
type CreateJobInput struct {
	Title       string  `json:"title" validate:"required,min=2,max=200"`
	Description string  `json:"description" validate:"required,min=10"`
	BudgetMin   float64 `json:"budget_min" validate:"required,gt=0"`
	BudgetMax   float64 `json:"budget_max" validate:"required,gtefield=BudgetMin"`
	Category    string  `json:"category" validate:"required,min=2,max=100"`
}

type UpdateJobInput struct {
	Title       string  `json:"title" validate:"omitempty,min=2,max=200"`
	Description string  `json:"description" validate:"omitempty,min=10"`
	BudgetMin   float64 `json:"budget_min" validate:"omitempty,gt=0"`
	BudgetMax   float64 `json:"budget_max" validate:"omitempty,gtefield=BudgetMin"`
	Category    string  `json:"category" validate:"omitempty,min=2,max=100"`
	Status      string  `json:"status" validate:"omitempty,oneof=open in_progress completed cancelled"`
}

type JobFilter struct {
	Search   string  `form:"search"`
	Category string  `form:"category"`
	MinPrice float64 `form:"min_price"`
	MaxPrice float64 `form:"max_price"`
	Status   string  `form:"status"`
	ClientID string  `form:"client_id"`
	Page     int     `form:"page,default=1"`
	Limit    int     `form:"limit,default=10"`
}