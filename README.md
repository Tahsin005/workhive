# Workhive 🐝

Workhive is a professional freelance marketplace platform designed to connect clients with top-tier freelancers. It features a robust contract management lifecycle, real-time communication, and secure payment processing.

---

## 🚀 Features

### For Clients 💼
- **Job Posting**: Create detailed job listings with budget ranges and categories.
- **Bid Management**: Review proposals, compare freelancers, and accept bids.
- **Contract Lifecycle**: Automated contract generation upon bid acceptance.
- **Secure Payments**: Fund contracts securely via **Stripe** integration.
- **Milestone Completion**: Mark projects as completed to release funds.
- **Reviews**: Rate and provide feedback on freelancer performance.

### For Freelancers 🛠️
- **Job Discovery**: Search and filter jobs by category, budget, and keywords.
- **Smart Bidding**: Submit proposals with custom rates and cover letters.
- **Project Workroom**: Dedicated space for active contracts with real-time chat.
- **Profile Management**: Showcase your bio, skills, and portfolio reviews.

### For Admins 🛡️
- **Platform Overview**: Real-time stats on users, jobs, and revenue.
- **Moderation Tools**: Ban/unban users and delete inappropriate job postings.
- **User Insights**: Detailed views of user activity and contract history.
- **Conflict Resolution**: Mediate and resolve disputed contracts.

---

## 🛠️ Tech Stack

### Backend
- **Language**: [Go (Golang)](https://golang.org/) 1.25+
- **Framework**: [Gin Gonic](https://gin-gonic.com/)
- **ORM**: [GORM](https://gorm.io/) with PostgreSQL
- **Real-time**: [Gorilla WebSockets](https://github.com/gorilla/websocket)
- **Security**: JWT with **Refresh Token Rotation** (HttpOnly Cookies)
- **File Storage**: [Cloudinary](https://cloudinary.com/)
- **Payments**: [Stripe API](https://stripe.com/)

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) (RTK Query)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)

---

## 🏁 Getting Started

### Prerequisites
- Go 1.25+
- Node.js 20+
- PostgreSQL

### 1. Clone the Repository
```bash
git clone https://github.com/Tahsin005/workhive.git
cd workhive
```

### 2. Backend Setup
```bash
cd workhive-backend
# Copy env and update your credentials
cp .env.example .env
# Install dependencies
go mod download
# Run the server
go run cmd/server/main.go
```

### 3. Frontend Setup
```bash
cd workhive-frontend
# Install dependencies
npm install
# Run the development server
npm run dev
```

---

## ⚙️ Environment Variables

### Backend (`.env`)
| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `CLOUDINARY_URL` | Cloudinary connection string |
| `ADMIN_SECRET` | Secret word for promoting users to admin |

### Frontend (`.env.local`)
| Variable | Description |
| :--- | :--- |
| `VITE_API_BASE_URL` | Backend API URL (e.g., http://localhost:8080/api/v1) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |

---

## 🏗️ Architecture

Workhive follows a **Clean Architecture** pattern on the backend:
- **Handlers**: HTTP layer handling requests and responses.
- **Services**: Business logic layer.
- **Repositories**: Data access layer.
- **Models**: Database schema definitions.

The frontend uses a **Feature-based** structure, leveraging RTK Query for sophisticated caching and real-time UI updates.

---

## 📚 Documentation
Detailed API documentation can be found in [api_doc.md](./api_doc.md).

