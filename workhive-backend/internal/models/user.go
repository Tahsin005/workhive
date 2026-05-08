package models

type Role string

const (
	RoleClient     Role = "client"
	RoleFreelancer Role = "freelancer"
	RoleAdmin      Role = "admin"
)

type User struct {
	Base
	FullName  string  `gorm:"type:varchar(100);not null" json:"full_name"`
	Email     string  `gorm:"type:varchar(150);uniqueIndex;not null" json:"email"`
	Password  string  `gorm:"type:varchar(255);not null" json:"-"`
	Role      Role    `gorm:"type:varchar(20);default:'client'" json:"role"`
	AvatarURL *string `gorm:"type:varchar(500)" json:"avatar_url"`
	Bio       *string `gorm:"type:text" json:"bio"`
	IsActive  bool    `gorm:"default:true" json:"is_active"`

	// associations
	Jobs []Job `gorm:"foreignKey:ClientID" json:"-"`
	Bids []Bid `gorm:"foreignKey:FreelancerID" json:"-"`
}