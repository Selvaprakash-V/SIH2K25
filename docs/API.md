# RuralIQ API Documentation

## Base URL
`http://localhost:8000/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

#### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "citizen"
}
```

### Villages

#### GET /villages
Get list of villages with optional filtering.

**Query Parameters:**
- `state` (optional): Filter by state
- `district` (optional): Filter by district
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Pagination limit (default: 100)

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Rampur",
    "district": "Guna",
    "state": "MP",
    "population": 2345,
    "sc_ratio": 68,
    "geo_lat": 24.6,
    "geo_long": 77.3,
    "amenities": {
      "village_id": "507f1f77bcf86cd799439011",
      "water": 1,
      "electricity": 75,
      "schools": 1,
      "health_centers": 0,
      "toilets": 62,
      "internet": 45
    }
  }
]
```

#### POST /villages
Create a new village (Admin/Field Officer only).

**Request Body:**
```json
{
  "name": "New Village",
  "district": "Sample District",
  "state": "Sample State",
  "population": 1500,
  "sc_ratio": 45.5,
  "geo_lat": 25.0,
  "geo_long": 75.0
}
```

#### GET /villages/{village_id}
Get detailed information about a specific village.

### Gap Detection

#### GET /gaps
Get gap analysis for villages.

**Query Parameters:**
- `village_id` (optional): Get gaps for specific village

**Response:**
```json
{
  "village_id": "507f1f77bcf86cd799439011",
  "gaps": {
    "water": {
      "status": "critical",
      "message": "No water access available",
      "priority": "high"
    },
    "electricity": {
      "status": "moderate",
      "message": "Only 75% electricity coverage",
      "priority": "medium"
    }
  },
  "severity_score": 45,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

#### GET /recommendations
Get villages prioritized by severity score.

**Query Parameters:**
- `limit` (optional): Number of recommendations (default: 10)

### Projects

#### GET /projects
Get list of projects with optional filtering.

**Query Parameters:**
- `village_id` (optional): Filter by village
- `status` (optional): Filter by status (planned, in_progress, completed)

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "village_id": "507f1f77bcf86cd799439011",
    "name": "School Building - Rampur",
    "type": "education",
    "progress_pct": 45.0,
    "status": "in_progress",
    "created_at": "2024-01-10T09:00:00Z"
  }
]
```

#### POST /projects
Create a new project (Admin/Field Officer only).

**Request Body:**
```json
{
  "village_id": "507f1f77bcf86cd799439011",
  "name": "Water Supply System",
  "type": "water",
  "progress_pct": 0,
  "status": "planned"
}
```

### Reports

#### POST /reports
Submit an issue report.

**Request Body (multipart/form-data):**
- `village_id`: Village ID
- `description`: Issue description
- `gps_lat`: GPS latitude
- `gps_long`: GPS longitude
- `image` (optional): Image file

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "message": "Report created successfully"
}
```

#### POST /sync/reports
Sync offline reports in batch.

**Request Body:**
```json
[
  {
    "village_id": "507f1f77bcf86cd799439011",
    "description": "Broken hand pump",
    "gps_lat": 24.6,
    "gps_long": 77.3,
    "client_id": "offline_1642234567890_0.123",
    "timestamp": "2024-01-15T08:30:00Z"
  }
]
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `422`: Unprocessable Entity (validation errors)
- `500`: Internal Server Error

## Gap Detection Logic

The gap detection system uses the following rules:

### Water Gap
- **Critical**: `water == 0` (no access)
- **Weight**: 25 points

### Electricity Gap
- **Critical**: `electricity < 50%`
- **Moderate**: `electricity < 80%`
- **Weight**: 20 points (proportional)

### Education Gap
- **Critical**: `schools == 0`
- **Moderate**: `schools < required` (1 per 1000 population)
- **Weight**: 15 points

### Healthcare Gap
- **Critical**: `health_centers == 0`
- **Moderate**: `health_centers < required` (1 per 5000 population)
- **Weight**: 20 points

### Sanitation Gap
- **Critical**: `toilets < 40%`
- **Moderate**: `toilets < 70%`
- **Weight**: 15 points (proportional)

### Connectivity Gap
- **Moderate**: `internet < 50%`
- **Weight**: 5 points (proportional)

**Total Severity Score**: Sum of all weighted gaps (0-100 scale)