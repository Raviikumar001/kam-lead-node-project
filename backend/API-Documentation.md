# API Endpoints Documentation

## API Endpoints Documentation

---

```
POST /api/auth/register      # Register new user
POST /api/auth/login        # Login user
POST /api/auth/refresh      # Refresh JWT token
POST /api/auth/logout       # Logout current session
POST /api/auth/logout-all   # Logout all sessions
```

---

## Lead Routes (/api/leads)

```
POST /api/leads             # Create new lead
PATCH /api/leads/:id        # Update lead
GET /api/leads             # Get all leads
GET /api/leads/:id         # Get lead by ID
```

---

## Contact Routes (/api/contacts)

```
POST /api/contacts                  # Create new contact
PATCH /api/contacts/:id            # Update contact
GET /api/contacts/lead/:leadId     # Get contacts by lead
GET /api/contacts/:id              # Get contact by ID
DELETE /api/contacts/:id           # Delete contact

```

---

## Interaction Routes (/api/interaction)

```
POST /api/interaction                    # Create new interaction
GET /api/interaction/lead/:leadId       # Get interactions by lead
GET /api/interaction/lead/:leadId/stats # Get lead interaction statistics
GET /api/interaction/lead/:leadId/last  # Get last interaction
```

---

## Call Planning Routes (/api/call-planning)

```
GET /api/call-planning/today                    # Get today's calls
POST /api/call-planning/lead/:leadId/update-call # Update call schedule
PATCH /api/call-planning/lead/:leadId/frequency # Update call frequency
```

---

## Performance Routes (/api/performance)

```
GET /api/performance/leads/:leadId/performance    # Get lead performance metrics
GET /api/performance/leads/performance           # Get leads filtered by performance
POST /api/performance/leads/performance/orders   # Update order history
```

---

# API Routes Working Examples

## Authentication Routes

### 1. Register User

```
POST http://localhost:8000/api/auth/register
```

```
// Request
{
  "email": "ravi@example.com",
  "password": "securePassword123",
  "name": "Ravi"
}

// Response 201
{
  "user": {
    "id": 1,
    "email": "ravi@example.com",
    "name": "Ravi",
    "createdAt": "2025-01-07T06:33:59Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 2. Login

```
POST http://localhost:8000/api/auth/login
```

```json
// Request
{
  "email": "ravi@example.com",
  "password": "securePassword123"
}

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "ravi@example.com",
    "name": "Ravi"
  }
}
```

---

## Table of Contents

- [Lead Management](#lead-management)
- [Contact Management](#contact-management)
- [Interaction Tracking](#interaction-tracking)
- [Call Planning](#call-planning)
- [Performance Metrics](#performance-metrics)
- [Error Handling](#error-handling)

## Lead Management

### Create Lead

```bash
POST http://localhost:8000/api/leads
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**

```json
{
  "restaurantName": "Taj Restau",
  "address": "123 Main St, Mumbai",
  "cuisineType": "Indian",
  "status": "NEW",
  "notes": "Premium location",
  "restaurantType": "QSR"
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "Taj Restaurant",
  "status": "new",
  "createdAt": "2025-01-07T06:33:59Z"
}
```

### Update Lead

```bash
PATCH http://localhost:8000/api/leads/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**

```json
{
  "restaurantName": "Tasty loves",
  "address": "456 Gourmet Avenue",
  "status": "INTERESTED",
  "restaurantType": "FINE_DINING",
  "notes": "Ready for premium partnership",
  "timezone": "Asia/Kolkata",
  "businessHoursStart": "10:00",
  "businessHoursEnd": "22:00",
  "callFrequency": "BIWEEKLY",
  "preferredCallDays": ["TUESDAY", "THURSDAY"]
}
```

**Response (200):**

```json
{
  "id": 1,
  "name": "Taj Restaurant",
  "status": "contacted",
  "updatedAt": "2025-01-07T06:34:59Z"
}
```

## Contact Management

### Create Contact

```bash
POST http://localhost:8000/api/contacts
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**

```json
{
  "leadId": 5,
  "name": "Rahul Sharma",
  "role": "MANAGER",
  "phone": "+919876543210",
  "email": "rahul@tajrestaurant.com",
  "isPrimary": true
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "Rahul Sharma",
  "role": "Restaurant Manager",
  "createdAt": "2025-01-07T06:35:59Z"
}
```

### Get Contacts by Lead

```bash
GET http://localhost:8000/api/contacts/lead/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**

```json
{
  "contacts": [
    {
      "id": 1,
      "name": "Rahul Sharma",
      "role": "Restaurant Manager",
      "phone": "+919876543210",
      "isPrimary": true
    }
  ]
}
```

## Interaction Tracking

### Create Interaction

```bash
POST http://localhost:8000/api/interaction
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**

```json
{
  "leadId": 5,
  "notes": "Discussed menu integration",
  "nextFollowup": "2025-01-14T06:33:59Z",
  "contactId": 5,
  "status": "FOLLOW_UP_NEEDED",
  "type": "CALL"
}
```

**Response (201):**

```json
{
  "id": 1,
  "type": "call",
  "status": "completed",
  "createdAt": "2025-01-07T06:36:59Z"
}
```

### Get Lead Interaction Stats

```bash
GET http://localhost:8000/api/interaction/lead/1/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**

```json
{
  "totalInteractions": 5,
  "lastInteraction": "2025-01-07T06:36:59Z",
  "interactionsByType": {
    "call": 3,
    "meeting": 1,
    "email": 1
  }
}
```

## Call Planning

### Get Today's Calls

```bash
GET http://localhost:8000/api/call-planning/today?timezone=Asia/Kolkata
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**

```json
{
  "calls": [
    {
      "leadId": 1,
      "restaurantName": "Taj Restaurant",
      "contactName": "Rahul Sharma",
      "phone": "+919876543210",
      "lastCallDate": "2025-01-01T06:33:59Z",
      "priority": "high"
    }
  ]
}
```

### Update Call Frequency

```bash
PATCH http://localhost:8000/api/call-planning/lead/5/frequency
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**

```json
{
  "frequency": "WEEKLY",
  "timezone": "Asia/Kolkata",
  "businessHoursStart": "09:00",
  "businessHoursEnd": "17:00",
  "preferredCallDays": ["MONDAY", "WEDNESDAY", "FRIDAY"]
}
```

**Response (200):**

```json
{
  "leadId": 1,
  "frequency": "weekly",
  "nextCallDate": "2025-01-14T06:33:59Z"
}
```

## Performance Metrics

### Get Lead Performance

```bash
GET http://localhost:8000/api/performance/leads/1/performance
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**

```json
{
  "leadId": 1,
  "metrics": {
    "totalOrders": 25,
    "averageOrderValue": 5000,
    "orderFrequency": "weekly",
    "lastOrderDate": "2025-01-06T06:33:59Z",
    "performanceScore": 85
  }
}
```

### Update Order History

```bash
POST http://localhost:8000/api/performance/leads/performance/orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**

```json
{
  "leadId": 1,
  "orderValue": 6000,
  "orderDate": "2025-01-07T06:33:59Z",
  "items": [
    {
      "name": "Butter Chicken",
      "quantity": 10,
      "price": 600
    }
  ]
}
```

**Response (200):**

```json
{
  "orderId": 1,
  "leadId": 1,
  "orderValue": 6000,
  "newPerformanceScore": 88
}
```

## Error Handling

The API uses conventional HTTP response codes to indicate the success or failure of requests.

### Common Error Responses

#### 400 Bad Request

```json
{
  "status": "error",
  "message": "Invalid input data",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

#### 404 Not Found

```json
{
  "status": "error",
  "message": "Lead not found"
}
```

#### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal server error"
}
```
