# Authentication API Documentation

## Base URL

`/api/auth`

---

### 1. Register New User

**Endpoint:** `POST /register`  
**Description:** Register a new user in the system.

#### Request Body:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "name": "John Doe",
  "role": "kam" // Optional, defaults to "kam"
}
```
