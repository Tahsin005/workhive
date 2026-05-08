package models

type Role string

const (
	RoleClient     Role = "client"
	RoleFreelancer Role = "freelancer"
	RoleAdmin      Role = "admin"
)

type User struct {
	Base
	FullName string `gorm:"type:varchar(100);not null" json:"full_name"`
	Email    string `gorm:"type:varchar(150);uniqueIndex;not null" json:"email"`
	Password string `gorm:"type:varchar(255);not null" json:"-"` // never expose in JSON
	Role     Role   `gorm:"type:varchar(20);default:'client'" json:"role"`
	IsActive bool   `gorm:"default:true" json:"is_active"`
}