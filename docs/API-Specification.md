# Kostly — REST API Specification

**Version:** 2.0  
**Status:** Approved Baseline — Full Feature & Domain Alignment  
**Last updated:** 20 November 2026  

---

## 1. API Conventions

- **Base URL:** `/api/v1`
- **Protocol:** HTTPS (enforced in deployed environments)
- **Format:** JSON (`Content-Type: application/json; charset=utf-8`)
- **Authentication:** Supabase Access Token provided via HTTP header:
  ```http
  Authorization: Bearer <supabase_jwt_access_token>
  ```
- **Resource Identifiers:** UUID v4 format.
- **Timestamps:** ISO 8601 / RFC 3339 in UTC (`YYYY-MM-DDTHH:MM:SSZ`).
- **Calendar Dates:** `YYYY-MM-DD`.
- **Currency & Money:** All monetary amounts are in Indonesian Rupiah (**IDR**) represented as 64-bit integers (`int64` / PostgreSQL `BIGINT`).

### 1.1. Response Envelopes

#### Standard Success Envelope
```json
{
  "data": {
    "id": "7b233a78-3619-4cb9-95a2-944c680214a1"
  }
}
```

#### Standard List Envelope (with Pagination)
```json
{
  "data": [
    { "id": "uuid-1" },
    { "id": "uuid-2" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

#### Standard Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload contains invalid fields.",
    "details": {
      "start_date": "Must be today or a future date.",
      "duration_months": "Must be at least 1 month."
    }
  }
}
```

---

## 2. HTTP Status & Error Codes

### Standard HTTP Status Codes
| Status | Meaning |
|---|---|
| `200 OK` | Successful request returning data. |
| `201 Created` | Successful creation of a resource. |
| `204 No Content` | Successful operation with empty body. |
| `400 Bad Request` | Malformed JSON or syntax failure. |
| `401 Unauthorized` | Missing, expired, or invalid Supabase JWT. |
| `403 Forbidden` | Authenticated, but lacking permission or unverified email. |
| `404 Not Found` | Target resource does not exist or hidden by security scope. |
| `409 Conflict` | Business conflict (e.g. overlapping booking, duplicate request). |
| `422 Unprocessable` | Semantically invalid payload or business rule violation. |
| `500 Server Error` | Unexpected server failure. |

### Application Error Codes
| Code | HTTP | Description |
|---|---|---|
| `AUTH_REQUIRED` | 401 | Missing or invalid Bearer token. |
| `EMAIL_VERIFICATION_REQUIRED`| 403 | Account email must be confirmed first. |
| `FORBIDDEN` | 403 | Role mismatch or resource ownership failure. |
| `RESOURCE_NOT_FOUND` | 404 | Resource does not exist or inaccessible. |
| `VALIDATION_ERROR` | 422 | Field-level constraint failures. |
| `ROOM_UNAVAILABLE` | 409 | Room is inactive or in maintenance. |
| `BOOKING_CONFLICT` | 409 | Requested period overlaps an approved booking. |
| `DUPLICATE_BOOKING` | 409 | Tenant already has an active booking on this room. |
| `INVALID_STATE_TRANSITION` | 422 | Action is invalid for the current resource status. |
| `PROPERTY_HAS_BOOKING_HISTORY` | 409 | Cannot delete property that has historical booking records. |
| `CHANGE_REQUEST_EXISTS` | 409 | A pending change request is already active for this booking. |
| `INTERNAL_ERROR` | 500 | Unhandled internal server exception. |

---

## 3. Endpoints Overview

### Authentication & Profile (`/me`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/me` | Authenticated | Get caller profile & role |
| `PATCH` | `/me` | Authenticated | Update permitted profile fields |
| `POST` | `/me/change-password` | Authenticated | Change password (old, new, confirm) |
| `POST` | `/me/change-email` | Authenticated | Change email (requires current password) |
| `POST` | `/me/deactivate` | Authenticated | Permanently deactivate account |

### Property Discovery (Public / Authenticated)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/properties` | Public | Search published boarding houses |
| `GET` | `/properties/{propertyId}` | Public | View property details, rooms & photos |
| `GET` | `/facilities` | Public | List facility catalog |

### Owner Property & Room Operations
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/owner/properties` | Owner | Create new property draft |
| `GET` | `/owner/properties` | Owner | List owned properties |
| `GET` | `/owner/properties/{propertyId}`| Owner | Get detailed owned property |
| `PATCH` | `/owner/properties/{propertyId}`| Owner | Update property fields |
| `DELETE`| `/owner/properties/{propertyId}`| Owner | Delete property (rejected if `has_booking_history == true`) |
| `POST` | `/owner/properties/{propertyId}/publish` | Owner | Publish property |
| `POST` | `/owner/properties/{propertyId}/archive` | Owner | Archive property |
| `POST` | `/owner/properties/{propertyId}/images` | Owner | Upload/register property photo |
| `DELETE`| `/owner/properties/{propertyId}/images/{id}`| Owner | Delete property photo |
| `POST` | `/owner/properties/{propertyId}/rooms` | Owner | Create room within property |
| `PATCH` | `/owner/rooms/{roomId}` | Owner | Update room fields & price |
| `DELETE`| `/owner/rooms/{roomId}` | Owner | Hard-delete room (cascades bookings & images) |
| `POST` | `/owner/rooms/{roomId}/images` | Owner | Upload/register room photo |
| `DELETE`| `/owner/rooms/{roomId}/images/{id}` | Owner | Delete room photo |

### Booking Operations
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/bookings` | Tenant | Submit monthly booking request |
| `GET` | `/bookings` | Tenant | List own submitted bookings |
| `GET` | `/bookings/{bookingId}` | Tenant / Owner | View booking details |
| `POST` | `/bookings/{bookingId}/cancel` | Tenant | Cancel pending or approved booking |
| `POST` | `/bookings/{bookingId}/change-requests` | Tenant | Submit period change request |
| `GET` | `/bookings/{bookingId}/change-requests` | Tenant / Owner | List change requests for booking |
| `POST` | `/bookings/{bookingId}/change-requests/{id}/cancel` | Tenant | Withdraw pending change request |
| `GET` | `/owner/bookings` | Owner | List booking requests on owned rooms |
| `POST` | `/owner/bookings/{bookingId}/approve` | Owner | Approve pending booking request |
| `POST` | `/owner/bookings/{bookingId}/reject` | Owner | Reject pending booking request |
| `DELETE`| `/owner/bookings/{bookingId}` | Owner | Hard-delete pending booking request |
| `POST` | `/owner/bookings/{bookingId}/cancel` | Owner | Cancel approved booking (before start) |
| `POST` | `/owner/bookings/{bookingId}/change-requests/{id}/approve` | Owner | Approve period change request |
| `POST` | `/owner/bookings/{bookingId}/change-requests/{id}/reject` | Owner | Reject period change request |

### Notification & Preferences
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/notifications` | Authenticated | List in-app notifications |
| `POST` | `/notifications/{id}/read` | Authenticated | Mark notification read |
| `POST` | `/notifications/read-all` | Authenticated | Mark all notifications read |
| `GET` | `/notification-preferences` | Authenticated | Get email category preferences |
| `PUT` | `/notification-preferences` | Authenticated | Update email category preferences |

### Property Reporting
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/reports` | Tenant | Submit new property report |
| `GET` | `/reports` | Tenant | List own filed reports |
| `GET` | `/reports/{reportId}` | Tenant | View own report details & history |
| `PATCH` | `/reports/{reportId}` | Tenant | Edit report (SUBMITTED only) |
| `POST` | `/reports/{reportId}/cancel` | Tenant | Cancel report (SUBMITTED only) |
| `POST` | `/reports/{reportId}/images` | Tenant | Upload evidence photo (max 3) |
| `DELETE`| `/reports/{reportId}/images/{id}`| Tenant | Delete evidence photo |
| `GET` | `/owner/reports` | Owner | List reports on owned properties |
| `GET` | `/owner/reports/{reportId}` | Owner | View report details (No reporter ID!) |
| `POST` | `/owner/reports/{reportId}/responses` | Owner | Submit owner statement on report |
| `PATCH` | `/owner/reports/{reportId}/responses/{id}` | Owner | Edit owner response statement |
| `DELETE`| `/owner/reports/{reportId}/responses/{id}` | Owner | Delete owner response statement |

---

## 4. Endpoint Specifications

### 4.1. Account & Profile

#### `GET /api/v1/me`
Returns the caller's profile and verified status.

**Response `200 OK`:**
```json
{
  "data": {
    "id": "e4f88d5e-2e06-4b8c-b9b9-cfa2348b4b1a",
    "role": "TENANT",
    "full_name": "Budi Santoso",
    "phone": "+628123456789",
    "avatar_url": "https://[ref].supabase.co/storage/v1/object/sign/avatars/e4f8/avatar.jpg?token=...",
    "email_verified": true,
    "is_active": true,
    "created_at": "2026-11-20T10:00:00Z"
  }
}
```

#### `POST /api/v1/me/change-password`
**Request Payload:**
```json
{
  "old_password": "CurrentPassword123!",
  "new_password": "NewSecretPassword456!",
  "confirm_password": "NewSecretPassword456!"
}
```

#### `POST /api/v1/me/deactivate`
Permanently deactivates caller's account.

**Response `200 OK`:**
```json
{
  "data": {
    "message": "Account successfully deactivated. Historical records have been preserved."
  }
}
```

---

### 4.2. Property & Room Operations

#### Delete Property — `DELETE /api/v1/owner/properties/{propertyId}`
Hard-deletes an owned property.

- **Precondition Check:** Evaluates `properties.has_booking_history`.
- If `has_booking_history == true`, deletion is strictly rejected.
- If `has_booking_history == false`, the property and any attached rooms/images are hard-deleted.

**Response `200 OK` (when has_booking_history == false):**
```json
{
  "data": {
    "message": "Property successfully deleted."
  }
}
```

**Response `409 Conflict` (when has_booking_history == true):**
```json
{
  "error": {
    "code": "PROPERTY_HAS_BOOKING_HISTORY",
    "message": "This property cannot be deleted because it has historical booking records."
  }
}
```

#### Delete Room — `DELETE /api/v1/owner/rooms/{roomId}`
Hard-deletes a room within an owned property.

- **Cascade Execution:** Deletes the room entity. PostgreSQL automatically cascades deletion to:
  - `bookings` (all status histories for this room)
  - `booking_change_requests`
  - `room_images`
- Orphaned image files are cleaned up from Supabase Storage asynchronously.
- Note: Deleting a room does **not** reset or clear `properties.has_booking_history`.

**Response `200 OK`:**
```json
{
  "data": {
    "message": "Room and all associated booking histories successfully deleted."
  }
}
```

---

### 4.3. Booking Operations

#### Submit Booking — `POST /api/v1/bookings`
Tenant creates a new monthly booking request.

**Request Payload:**
```json
{
  "room_id": "4b68e91f-0e86-4fba-bb5c-1961fc4b96bb",
  "start_date": "2026-12-01",
  "duration_months": 3
}
```

**Response `201 Created`:**
```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "room_id": "4b68e91f-0e86-4fba-bb5c-1961fc4b96bb",
    "tenant_id": "e4f88d5e-2e06-4b8c-b9b9-cfa2348b4b1a",
    "start_date": "2026-12-01",
    "end_date": "2027-03-01",
    "duration_months": 3,
    "monthly_price_snapshot": 1200000,
    "total_price": 3600000,
    "status": "PENDING",
    "created_at": "2026-11-20T12:00:00Z"
  }
}
```

#### Approve Booking — `POST /api/v1/owner/bookings/{bookingId}/approve`
Owner approves a pending booking.

**Request Payload (Optional decision note):**
```json
{
  "decision_note": "Booking disetujui. Silakan kontak WA untuk transfer pembayaran."
}
```

**Response `200 OK`:**
```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "APPROVED",
    "decision_note": "Booking disetujui. Silakan kontak WA untuk transfer pembayaran.",
    "decided_at": "2026-11-20T13:30:00Z"
  }
}
```

#### Cancel Booking — `POST /api/v1/bookings/{bookingId}/cancel`
Cancel an approved or pending booking before check-in.

**Request Payload:**
```json
{
  "cancellation_reason": "Rencana magang dipindahkan ke kota lain."
}
```

**Response `200 OK`:**
```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "CANCELLED",
    "cancelled_by": "e4f88d5e-2e06-4b8c-b9b9-cfa2348b4b1a",
    "cancellation_reason": "Rencana magang dipindahkan ke kota lain.",
    "cancelled_at": "2026-11-21T08:15:00Z"
  }
}
```

#### Request Period Change — `POST /api/v1/bookings/{bookingId}/change-requests`
Tenant requests altered dates for an active approved booking.

**Request Payload:**
```json
{
  "requested_start_date": "2026-12-15",
  "requested_duration_months": 4
}
```

**Response `201 Created`:**
```json
{
  "data": {
    "id": "19b5b248-6d2c-47bc-a3f2-1a221f73b6e8",
    "booking_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "requested_start_date": "2026-12-15",
    "requested_end_date": "2027-04-15",
    "requested_duration_months": 4,
    "new_monthly_price_snapshot": 1200000,
    "new_total_price": 4800000,
    "status": "PENDING",
    "created_at": "2026-11-22T09:00:00Z"
  }
}
```

---

### 4.4. Property Reporting Operations

#### Submit Report — `POST /api/v1/reports`
Tenant submits a report against a property.

**Request Payload:**
```json
{
  "property_id": "7b233a78-3619-4cb9-95a2-944c680214a1",
  "is_anonymous": true,
  "category": "FASILITAS_RUSAK",
  "description": "Pompa air mati sejak 3 hari lalu dan tidak diperbaiki oleh pengelola."
}
```

**Response `201 Created`:**
```json
{
  "data": {
    "id": "8c41d1aa-5b23-4e31-8f43-02f0687705cc",
    "property_id": "7b233a78-3619-4cb9-95a2-944c680214a1",
    "is_anonymous": true,
    "category": "FASILITAS_RUSAK",
    "description": "Pompa air mati sejak 3 hari lalu dan tidak diperbaiki oleh pengelola.",
    "status": "SUBMITTED",
    "created_at": "2026-11-20T14:00:00Z"
  }
}
```

#### Owner View Reports — `GET /api/v1/owner/reports/{reportId}`
Owner reviews reports filed against their property. Note that `reporter_id` is completely omitted.

**Response `200 OK`:**
```json
{
  "data": {
    "id": "8c41d1aa-5b23-4e31-8f43-02f0687705cc",
    "property_id": "7b233a78-3619-4cb9-95a2-944c680214a1",
    "category": "FASILITAS_RUSAK",
    "description": "Pompa air mati sejak 3 hari lalu dan tidak diperbaiki oleh pengelola.",
    "status": "UNDER_REVIEW",
    "created_at": "2026-11-20T14:00:00Z",
    "images": [
      {
        "id": "img-uuid-1",
        "url": "https://[ref].supabase.co/storage/v1/object/sign/reports/8c41/img1.jpg?token=..."
      }
    ],
    "status_history": [
      {
        "from_status": "SUBMITTED",
        "to_status": "UNDER_REVIEW",
        "created_at": "2026-11-20T15:00:00Z"
      }
    ],
    "owner_responses": [
      {
        "id": "resp-uuid-1",
        "message": "Teknisi pompa sudah dipanggil dan akan tiba besok pagi.",
        "created_at": "2026-11-20T16:00:00Z"
      }
    ]
  }
}
```

#### Owner Submit Response — `POST /api/v1/owner/reports/{reportId}/responses`
Owner posts a statement to operators regarding the report.

**Request Payload:**
```json
{
  "message": "Teknisi pompa sudah dipanggil dan akan tiba besok pagi."
}
```

**Response `201 Created`:**
```json
{
  "data": {
    "id": "resp-uuid-1",
    "report_id": "8c41d1aa-5b23-4e31-8f43-02f0687705cc",
    "message": "Teknisi pompa sudah dipanggil dan akan tiba besok pagi.",
    "created_at": "2026-11-20T16:00:00Z"
  }
}
```
