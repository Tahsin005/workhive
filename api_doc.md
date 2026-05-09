# Workhive API Documentation

Base URL: `http://localhost:8080` (or your configured server URL)

All endpoints returning data use a standardized JSON wrapper:
```json
{
  "status": "success",     // or "error"
  "message": "Human readable message",
  "data": { ... },         // The payload (omitted on error)
  "error": "Error details" // Only present if status is "error"
}
```

Paginated endpoints include pagination metadata in the root response:
```json
{
  "status": "success",
  "message": "Data fetched successfully",
  "data": [ ... ],
  "pagination": {
    "total_items": 100,
    "total_pages": 10,
    "current_page": 1,
    "limit": 10
  }
}
```

---

## 1. Auth Endpoints

### `POST /api/v1/auth/register`
**Description:** Creates a new user account.

**Request:**
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "role": "client" // Must be "client" or "freelancer"
  }
  ```

**Responses:**
- `201 Created`: Returns the user object and a JWT `token`.
- `400 Bad Request`: Validation error (e.g., weak password, invalid role).
- `409 Conflict`: Email is already in use.

**Edge Cases:**
- Email addresses are strictly normalized to lowercase before registration.
- Admin accounts cannot be created via this endpoint.

---

### `POST /api/v1/auth/login`
**Description:** Authenticates a user and returns a JWT token.

**Request:**
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```

**Responses:**
- `200 OK`: Returns the user object and a JWT `token`.
- `401 Unauthorized`: Generic "Invalid email or password" message.
- `403 Forbidden`: Account is banned/inactive.

**Edge Cases:**
- Soft-deleted users are treated as non-existent and will receive a `401 Unauthorized`.
- The error message for wrong email vs wrong password is intentionally identical for security.

---

### `GET /api/v1/auth/me`
**Description:** Returns the currently authenticated user's profile.

**Request:**
- **Headers:** `Authorization: Bearer <token>`

**Responses:**
- `200 OK`: Returns the `User` object (excluding password).
- `401 Unauthorized`: Invalid or expired token.
- `404 Not Found`: User no longer exists.

---

### `PUT /api/v1/auth/me`
**Description:** Updates the authenticated user's profile (name, bio).

**Request:**
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:** (All fields optional)
  ```json
  {
    "full_name": "Jane Doe",
    "bio": "Experienced designer based in NY."
  }
  ```

**Responses:**
- `200 OK`: Returns the updated user object.
- `400 Bad Request`: Validation failure.

**Edge Cases:**
- Cannot change `email` or `role` via this endpoint.

---

### `PUT /api/v1/auth/me/avatar`
**Description:** Uploads and updates the user's profile avatar.

**Request:**
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data:**
  - `file`: The image file (max 2MB, formats: `.jpg`, `.jpeg`, `.png`, `.webp`)

**Responses:**
- `200 OK`: Returns the updated user object containing the new `avatar_url`.
- `400 Bad Request`: File too large, missing file, or unsupported file type.
- `500 Internal Server Error`: Cloudinary upload failure.

---

### `PUT /api/v1/auth/me/password`
**Description:** Changes the authenticated user's password.

**Request:**
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "current_password": "oldpassword123",
    "new_password": "newpassword123"
  }
  ```

**Responses:**
- `200 OK`: Password updated successfully.
- `400 Bad Request`: `current_password` is incorrect, or `new_password` matches the old one.

---

### `DELETE /api/v1/auth/me`
**Description:** Soft deletes the authenticated user's account.

**Request:**
- **Headers:** `Authorization: Bearer <token>`

**Responses:**
- `200 OK`: Account deleted successfully.

**Edge Cases:**
- Soft deletion hides the user from login attempts but preserves historical data (like contracts and reviews).

---

## 2. Job Endpoints

### `GET /api/v1/jobs`
**Description:** Public job listing with search, filtering, and pagination.

**Request:**
- **Query Parameters:**
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10, max: 50)
  - `category`: Filter by exact category (e.g., `design`)
  - `search`: Searches `title` and `description`
  - `min_price`: Minimum budget
  - `max_price`: Maximum budget

**Responses:**
- `200 OK`: Returns a paginated list of open jobs.
- `400 Bad Request`: If `min_price > max_price`.

**Edge Cases:**
- Public listings **only** return jobs with `status = 'open'`.

---

### `GET /api/v1/jobs/:id`
**Description:** View details of a specific job.

**Request:**
- **Path Parameter:** `id` (UUID)

**Responses:**
- `200 OK`: Returns the job object, preloaded with client details and total bids count.
- `404 Not Found`: Job does not exist or is soft-deleted.

**Edge Cases:**
- Unlike the list endpoint, specific closed or completed jobs can still be viewed publicly via ID.

---

### `GET /api/v1/jobs/my`
**Description:** List jobs posted by the authenticated client.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Client only)
- **Query Parameters:** Pagination and filters support the same structure as `GET /api/v1/jobs`.

**Responses:**
- `200 OK`: Paginated list of jobs belonging to the client.

**Edge Cases:**
- Returns jobs in **all statuses** (open, in_progress, completed, cancelled) so the client can view their full history.

---

### `POST /api/v1/jobs`
**Description:** Create a new job posting.

**Request:**
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json` (Client only)
- **Body:**
  ```json
  {
    "title": "Build a React App",
    "description": "Looking for a frontend developer...",
    "budget_min": 500.00,
    "budget_max": 1000.00,
    "category": "Development"
  }
  ```

**Responses:**
- `201 Created`: Returns the newly created job.
- `400 Bad Request`: Validation failure (e.g. `budget_min > budget_max`).

---

### `PUT /api/v1/jobs/:id`
**Description:** Update a job posting.

**Request:**
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json` (Client only)
- **Path Parameter:** `id` (UUID)
- **Body:** (All fields optional)
  ```json
  {
    "title": "Build a React + Go App",
    "budget_max": 1200.00
  }
  ```

**Responses:**
- `200 OK`: Returns the updated job.
- `400 Bad Request`: Cannot edit a job that is not in the `open` status.
- `403 Forbidden`: You do not own this job.

**Edge Cases:**
- Clients cannot change the job `status` manually through this endpoint; it is handled automatically through the bid/contract lifecycle.

---

### `DELETE /api/v1/jobs/:id`
**Description:** Soft delete a job posting.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Client only)
- **Path Parameter:** `id` (UUID)

**Responses:**
- `200 OK`: Job deleted successfully.
- `400 Bad Request`: Cannot delete a job with an accepted bid or active contract.
- `403 Forbidden`: You do not own this job.

---

## 3. Bid Endpoints

### `POST /api/v1/jobs/:id/bids`
**Description:** Freelancer submits a bid on a job.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Freelancer only)
- **Path Parameter:** `id` (Job UUID)
- **Body:**
  ```json
  {
    "amount": 800.00,
    "cover_letter": "I can build this for you perfectly."
  }
  ```

**Responses:**
- `201 Created`: Returns the new bid.
- `400 Bad Request`: Job is not `open`.
- `409 Conflict`: Freelancer already has an active (pending/accepted) bid on this job.

**Edge Cases:**
- Freelancers can only have **one** active bid per job. However, if their previous bid was rejected or withdrawn, they are allowed to submit a new bid.

---

### `GET /api/v1/jobs/:id/bids`
**Description:** View all bids on a specific job.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Client only)
- **Path Parameter:** `id` (Job UUID)

**Responses:**
- `200 OK`: Returns a list of all bids placed on the job, including freelancer details.
- `403 Forbidden`: Only the client who posted the job can view its bids.

**Edge Cases:**
- Shows bids in all statuses (pending, accepted, rejected, withdrawn).

---

### `GET /api/v1/bids/my`
**Description:** Freelancer views their own submitted bids.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Freelancer only)
- **Query Parameters:** Pagination params supported.

**Responses:**
- `200 OK`: Paginated list of the freelancer's bids.

---

### `PUT /api/v1/bids/:id`
**Description:** Edit a pending bid.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Freelancer only)
- **Path Parameter:** `id` (Bid UUID)
- **Body:** (All fields optional)
  ```json
  {
    "amount": 750.00,
    "cover_letter": "Revised cover letter."
  }
  ```

**Responses:**
- `200 OK`: Returns updated bid.
- `400 Bad Request`: Bid is no longer `pending`.
- `403 Forbidden`: Not your bid.

---

### `PATCH /api/v1/bids/:id/withdraw`
**Description:** Withdraw a pending bid.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Freelancer only)
- **Path Parameter:** `id` (Bid UUID)

**Responses:**
- `200 OK`: Bid withdrawn successfully.
- `400 Bad Request`: Bid is already accepted, rejected, or withdrawn.

---

### `PUT /api/v1/bids/:id/accept`
**Description:** Client accepts a bid, generating a contract.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Client only)
- **Path Parameter:** `id` (Bid UUID)

**Responses:**
- `200 OK`: Returns the accepted bid.
- `400 Bad Request`: Bid is not `pending` or Job is not `open`.
- `403 Forbidden`: Not your job.

**Edge Cases:**
- **Transactional Flow:** When a bid is accepted, all other pending bids on that job are automatically marked as `rejected`, the job is marked `in_progress`, and a new `active` contract is generated instantly.

---

### `PUT /api/v1/bids/:id/reject`
**Description:** Client rejects a specific bid.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Client only)
- **Path Parameter:** `id` (Bid UUID)

**Responses:**
- `200 OK`: Bid rejected successfully.

---

## 4. Contract Endpoints

### `GET /api/v1/contracts`
**Description:** List own contracts for both clients and freelancers.

**Request:**
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** Pagination params supported. Filter by `?status=active`.

**Responses:**
- `200 OK`: Paginated list of `ContractResponse` objects containing job, client, and freelancer details.

---

### `GET /api/v1/contracts/:id`
**Description:** View details of a specific contract.

**Request:**
- **Headers:** `Authorization: Bearer <token>`
- **Path Parameter:** `id` (Contract UUID)

**Responses:**
- `200 OK`: Contract details.
- `403 Forbidden`: You are not the client or freelancer on this contract.

---

### `PUT /api/v1/contracts/:id/complete`
**Description:** Client marks the contract as completed.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Client only)
- **Path Parameter:** `id` (Contract UUID)

**Responses:**
- `200 OK`: Contract marked as completed.
- `400 Bad Request`: Cannot complete a contract that does not have a fully paid Stripe payment attached.

---

### `PUT /api/v1/contracts/:id/cancel`
**Description:** Cancel an active contract.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Client or Freelancer)
- **Path Parameter:** `id` (Contract UUID)

**Responses:**
- `200 OK`: Contract cancelled successfully.
- `400 Bad Request`: Cannot cancel a contract if the client has already made a payment.

**Edge Cases:**
- Cancelling a contract automatically moves the associated job's status back to `open` so the client can pick another bid.
- All previously rejected bids for this job are restored to `pending` status.

---

## 5. Payment Endpoints

### `POST /api/v1/payments/intent`
**Description:** Create a Stripe PaymentIntent to fund a contract.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Client only)
- **Body:**
  ```json
  {
    "contract_id": "uuid"
  }
  ```

**Responses:**
- `201 Created`: Returns `client_secret` to be used by Stripe.js on the frontend.
- `409 Conflict`: A pending or paid payment already exists for this contract.

---

### `POST /api/v1/payments/webhook`
**Description:** Stripe event webhook receiver.

**Request:**
- **Headers:** `Stripe-Signature`
- **Body:** Raw bytes from Stripe.

**Responses:**
- `200 OK`: Successfully received (whether `payment_intent.succeeded` or failed).
- `400 Bad Request`: Invalid signature.

**Edge Cases:**
- Completely bypasses standard JWT auth.
- If a payment succeeds, the system automatically updates the payment status to `paid`, and immediately marks the associated contract and job as `completed`.

---

### `GET /api/v1/contracts/:id/payments`
**Description:** View payment history for a specific contract.

**Request:**
- **Headers:** `Authorization: Bearer <token>`
- **Path Parameter:** `id` (Contract UUID)

**Responses:**
- `200 OK`: List of payments attempted/successful for the contract.
- `403 Forbidden`: You are not a participant in this contract.

---

## 6. Message Endpoints

### `GET /api/v1/contracts/:id/messages`
**Description:** Load full chat history for a contract.

**Request:**
- **Headers:** `Authorization: Bearer <token>`
- **Path Parameter:** `id` (Contract UUID)

**Responses:**
- `200 OK`: List of messages sorted oldest-to-newest.

---

### `POST /api/v1/contracts/:id/messages`
**Description:** REST fallback for sending a message.

**Request:**
- **Headers:** `Authorization: Bearer <token>`
- **Path Parameter:** `id` (Contract UUID)
- **Body:**
  ```json
  {
    "content": "Hello! Looking forward to working together."
  }
  ```

**Responses:**
- `201 Created`: Message sent.
- `400 Bad Request`: Contract is not active (cannot chat on completed/cancelled contracts).

---

### `PUT /api/v1/contracts/:id/messages/read`
**Description:** Mark all unread messages from the other party as read.

**Request:**
- **Headers:** `Authorization: Bearer <token>`

**Responses:**
- `200 OK`: Returns the count of messages updated.

---

### `WS /api/v1/ws/chat/:contractId`
**Description:** Connect to real-time bidirectional WebSocket chat.

**Request:**
- **Connection URL:** `ws://domain/api/v1/ws/chat/:contractId?token=JWT_TOKEN_HERE`

**Responses:**
- Rejects connection with `1008 Policy Violation` if token is invalid or contract is inactive.
- Sends and receives real-time JSON payloads mirroring the `MessageResponse` struct.

---

## 7. Review Endpoints

### `POST /api/v1/contracts/:id/reviews`
**Description:** Submit a review after contract completion.

**Request:**
- **Headers:** `Authorization: Bearer <token>`
- **Path Parameter:** `id` (Contract UUID)
- **Body:**
  ```json
  {
    "rating": 5,
    "comment": "Great experience working with them!"
  }
  ```

**Responses:**
- `201 Created`: Review submitted.
- `400 Bad Request`: Contract must be `completed`. Rating must be 1-5.
- `409 Conflict`: You have already reviewed this contract.

---

### `GET /api/v1/users/:id/reviews`
**Description:** Publicly view reviews on a user's profile.

**Request:**
- **Path Parameter:** `id` (User UUID)
- **Query Parameters:** Pagination params supported.

**Responses:**
- `200 OK`: Paginated reviews, plus aggregate data (`average_rating`, `total_reviews`).

---

## 8. Admin Endpoints

### `GET /api/v1/admin/users`
**Description:** List all users (including soft-deleted).

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Admin only)
- **Query Parameters:** `page`, `limit`, `role`, `is_active`, `search`

**Responses:**
- `200 OK`: Paginated user list with a derived `is_deleted` flag.

---

### `GET /api/v1/admin/users/:id`
**Description:** Full user detail dashboard.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Admin only)

**Responses:**
- `200 OK`: Returns user profile alongside heavily aggregated stats (`total_jobs`, `total_bids`, `total_contracts`).

---

### `PUT /api/v1/admin/users/:id/ban`
**Description:** Toggle a user's `is_active` (ban/unban) status.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Admin only)

**Responses:**
- `200 OK`: "User banned successfully" or "User unbanned successfully".
- `400 Bad Request`: Admins cannot ban themselves.
- `403 Forbidden`: Admins cannot ban other admins.

---

### `DELETE /api/v1/admin/users/:id`
**Description:** Soft delete a user.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Admin only)

**Responses:**
- `200 OK`: User soft-deleted.
- `400 Bad Request`: Cannot delete a user if they have active contracts.

---

### `GET /api/v1/admin/jobs`
**Description:** List all jobs (all statuses) with search.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Admin only)

**Responses:**
- `200 OK`: Paginated list of jobs.

---

### `DELETE /api/v1/admin/jobs/:id`
**Description:** Delete any job on the platform.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Admin only)

**Responses:**
- `200 OK`: Job deleted.
- `400 Bad Request`: Cannot delete if job has active contracts.

---

### `GET /api/v1/admin/stats`
**Description:** Platform-wide metrics.

**Request:**
- **Headers:** `Authorization: Bearer <token>` (Admin only)

**Responses:**
- `200 OK`:
  ```json
  {
    "total_users": 150,
    "total_clients": 50,
    "total_freelancers": 100,
    "total_jobs": 300,
    "open_jobs": 120,
    "total_contracts": 80,
    "active_contracts": 40,
    "completed_contracts": 35,
    "total_revenue": 45000.50,
    "pending_revenue": 2000.00
  }
  ```

---

### `POST /api/v1/promote/:email/:secret`
**Description:** Bootstrap an admin account.

**Request:**
- **Path Parameters:**
  - `email`: Target user's email.
  - `secret`: Server's `ADMIN_SECRET` environment variable.

**Responses:**
- `200 OK`: User promoted to Admin.
- `403 Forbidden`: Secret mismatch.
- `400 Bad Request`: User is already an admin.
