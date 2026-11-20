# Kostly — Product Requirements Document (PRD)

**Version:** 2.0  
**Status:** Approved Baseline — Full Feature & Domain Alignment  
**Last updated:** 20 November 2026  

---

## 1. Product Overview

Kostly is a specialized boarding-house (*kost*) discovery and rental management platform in Indonesia that directly connects property owners (**Owner**) with prospective and existing tenants (**Tenant**).

Kostly bridges the gap in the monthly rental market by providing:
- A structured, transparent booking workflow with Owner approval.
- Centralized property and room management for boarding-house owners.
- Direct reporting of property issues to maintain listing quality and community trust.
- Clear distinction between platform-governed workflow and manual off-platform payment settlements.

Kostly is built as a portfolio-grade full-stack product emphasizing software engineering best practices, rigorous relational database modeling, transactional consistency, and secure multi-role access control.

---

## 2. Target Users & Roles

Kostly recognizes strictly **two** authenticated roles in the MVP:

1. **Owner (`OWNER`):** Boarding-house owner or operator who manages properties, rooms, amenities, receives rental requests, processes booking approvals/rejections, responds to property reports, and tracks rental schedules.
2. **Tenant (`TENANT`):** Boarding-house seeker or resident who searches published properties, inspects room availability, submits monthly booking requests, requests period alterations, cancels eligible bookings, and reports property infractions.

> [!IMPORTANT]
> **No Admin Role in MVP:** There is no distinct `ADMIN` role or custom administrative dashboard in the MVP. Platform maintenance, report reviews, and account operations are performed directly by Kostly operators through the Supabase Studio Dashboard.

---

## 3. Product Scope & Functional Requirements

### 3.1. Authentication & Account Management

1. **Dedicated Registration Entry Points:** Owner and Tenant registration use distinct user interfaces and entry points to collect initial intent clearly.
2. **Single Primary Role per Account:** In the MVP, a user account holds exactly one role (`OWNER` or `TENANT`). Role switching or dual-role accounts are not supported.
3. **Automated Profile Provisioning via Trigger:**
   - Registration executes via Supabase Auth.
   - An `AFTER INSERT` PostgreSQL database trigger on `auth.users` creates the initial `public.profiles` record.
   - The trigger runs with `SECURITY DEFINER` and a locked-down `search_path`.
   - The trigger extracts the `role` from the user's signup metadata (`raw_user_meta_data->>'role'`).
   - The trigger strictly validates that the role is either `OWNER` or `TENANT`. If the role is missing or invalid, the signup is rejected at the database level. No fallback or default role is permitted.
4. **Server-Authoritative Role Authorization:** The Go backend validates the caller's JWT, derives the authenticated identity (`sub`), and reads the user's role from `public.profiles`. The backend never trusts client-supplied roles.
5. **Mandatory Email Verification:**
   - Email verification is required before any user can access protected application features.
   - Both the frontend application router and the Go backend authorization layer enforce verified email status (`email_confirmed_at IS NOT NULL` / verified JWT claim).
   - Users with unverified emails can only access the verification pending screen and trigger verification email resends.
6. **Credential & Account Lifecycle Operations:**
   - **Email Verification, Forgot Password, and Password Reset:** Handled via Supabase Auth native email infrastructure.
   - **Change Password:** Requires the user to provide their old password, new password, and confirmation of the new password.
   - **Change Email:** Requires confirmation of the user's current password.
7. **Inactivity Policy:** Kostly does not automatically deactivate or expire accounts due to inactivity.
8. **Account Deactivation & Deletion Policy:**
   - **Accounts with Booking History:** Physical hard-deletion is prohibited to protect historical transactional and audit integrity. The profile is permanently deactivated (`is_active = false`, `deactivated_at = now()`).
   - **Permanent Deactivation:** Deactivated accounts cannot be reactivated by the user. If they wish to use Kostly again, they must register anew.
   - **Email Reuse Allowance:** A user whose account has been permanently deactivated may reuse their email address to register a fresh account. The fresh account receives a brand-new UUID and profile; historical records remain permanently associated with the old profile UUID.
   - *Technical requirement:* The backend architecture must safely manage Supabase Auth's unique email constraint during deactivation without destroying relational booking history.

---

### 3.2. Property & Room Management

1. **Owner Ownership Scope:** An Owner can create, read, update, and manage only properties and rooms that they personally own.
2. **Property Lifecycle & Statuses:**
   - `DRAFT`: Newly created listing under construction. Incomplete listings remain drafts and are never visible to tenants.
   - `PUBLISHED`: Fully configured listing visible in public discovery and eligible for booking requests. Requires complete location, facilities, and at least one active room.
   - `ARCHIVED`: Delisted or deactivated property. Retains historical data but hidden from public search and cannot receive new booking requests.
3. **Property Attributes:**
   - Name, description, address, city, province.
   - Precise WGS84 GPS coordinates (latitude, longitude) alongside formatted text address.
   - Reusable facilities linked via a many-to-many catalog.
   - Property photo gallery with sort order.
4. **Room Lifecycle & Statuses:**
   - `ACTIVE`: Available for discovery and booking requests.
   - `INACTIVE`: Temporarily hidden from new bookings by the Owner.
   - `MAINTENANCE`: Room undergoing repairs or renovation; ineligible for new bookings.
5. **Room Attributes:**
   - Room name/label, description, monthly rental price in IDR (`BIGINT`), capacity (positive integer), status, and dedicated room photo gallery.
6. **Property & Room Deletion Rules:**
   - **Room Deletion:** Room deletion uses hard-delete. When an owner deletes a room, all historical bookings associated with that room are deleted via `ON DELETE CASCADE`. Room photos and related derived records are also removed, and corresponding image files in Supabase Storage must be purged. Rooms with historical bookings are explicitly permitted to be hard-deleted (soft-delete or retention blocks on room deletion are not used).
   - **Property Deletion & Persistent Marker:**
     - A property that has ever had booking history cannot be hard-deleted.
     - To ensure this restriction is permanent and cannot be bypassed by deleting rooms, the `properties` entity maintains a persistent marker: `has_booking_history BOOLEAN NOT NULL DEFAULT FALSE`.
     - When the first booking request is created for any room belonging to the property, `has_booking_history` is set to `TRUE`.
     - Once set to `TRUE`, `has_booking_history` **never reverts to `FALSE`**, even if all rooms or their cascaded booking histories are subsequently deleted.
     - Hard deletion of a property is strictly rejected if `has_booking_history == TRUE`.

---

### 3.3. Booking System

1. **Request-Based Approval Model:** Every booking requires explicit Owner review and approval. Instant bookings are not supported.
2. **Rental Duration & Calendar Intervals:**
   - Monthly rental only; minimum duration is **1 month**. No upper limit.
   - Start date (`start_date`) must be today or a future date (`start_date >= CURRENT_DATE`). Historical dates are rejected.
   - Rental periods use half-open intervals: `[start_date, end_date)`. `start_date` is inclusive (check-in day); `end_date` is exclusive (checkout day).
   - `end_date` is calculated using strict calendar-month addition, clamping to the final day of the target month when the source day does not exist in the target month (e.g., Jan 31 + 1 month = Feb 28 or 29).
3. **Server-Authoritative Pricing & Snapshots:**
   - Currency is strictly Indonesian Rupiah (**IDR**).
   - All monetary fields use PostgreSQL **`BIGINT`** (no fractional cents).
   - Total price is computed server-side: `total_price = monthly_price_snapshot * duration_months`.
   - The price snapshot (`monthly_price_snapshot`) captures the room's price at request time and remains immutable. Subsequent room price adjustments by the owner never alter existing bookings.
4. **Payment Boundary:**
   - Manual payment arrangement directly between Tenant and Owner outside the application.
   - Kostly does not integrate payment gateways, escrow, or in-app payment collection in the MVP.
5. **Availability & Overlap Rules:**
   - `PENDING` bookings do **not** lock a room. Multiple pending requests may overlap for the same room.
   - Only `APPROVED` bookings lock the room for the specified interval `[start_date, end_date)`.
   - Two `APPROVED` bookings for the same room can never overlap.
   - A Tenant is permitted to hold overlapping `APPROVED` bookings across **different rooms** (e.g. booking for family or colleagues).
6. **Duplicate Booking Prevention:**
   - A duplicate booking is defined as: same `tenant_id`, same `room_id`, and overlapping rental period.
   - A Tenant who holds an existing `PENDING` or `APPROVED` booking on a room is blocked from creating a new overlapping request on that same room.
   - Statuses `REJECTED`, `CANCELLED`, and `EXPIRED` do not block new requests.
7. **Automatic Expiration:**
   - A `PENDING` booking automatically transitions to `EXPIRED` exactly **72 hours** after creation if the Owner has not acted on it.
   - Handled via a scheduled background worker or database-level job.
8. **Owner Decision Operations:**
   - **Approve:** Locks the room interval. Validates availability inside a serializable/locked transaction. Sets status to `APPROVED`.
   - **Reject:** Sets status to `REJECTED`. Preserves booking history and records an optional `decision_note`.
   - **Hard Delete Pending:** Owner may permanently delete a `PENDING` request submitted to their property if desired.
9. **Cancellation Rules:**
   - **Pending Booking Cancellation:** Tenant may cancel a `PENDING` booking at any time. Must provide a mandatory `cancellation_reason`. Status changes to `CANCELLED`.
   - **Approved Booking Cancellation:**
     - Both the Tenant and the owning Owner can cancel an `APPROVED` booking.
     - **Constraint:** Cancellation of an approved booking is permitted **only before `start_date`** (`CURRENT_DATE < start_date`). Once the rental interval has commenced, in-app cancellation is disallowed.
     - Mandatory `cancellation_reason` required.
     - Status changes to `CANCELLED`; the locked room interval is immediately released.
     - Tracks cancellation audit metadata: `cancelled_by`, `cancellation_reason`, `cancelled_at`.
10. **Booking Period Change Requests:**
    - A Tenant holding an `APPROVED` booking may request an altered date period (`requested_start_date`, `requested_duration_months`).
    - Stored as a separate child entity (`booking_change_requests`) to preserve history.
    - Only **one active pending change request** is allowed per booking at any time.
    - The original approved booking period remains active and intact while the change request is pending.
    - Tenant may cancel their pending change request at any time without affecting the original booking.
    - Owner can approve or reject the change request.
    - If Owner approves: Room availability is re-validated for the new period. The booking's `start_date`, `end_date`, `duration_months`, `monthly_price_snapshot`, and `total_price` are atomically updated.
    - If Owner rejects: Owner **must provide a rejection reason**. The original booking continues unchanged.

---

### 3.4. Notification & Email System

1. **Dual-Channel Delivery:** Kostly provides real-time In-App Notifications and asynchronous Email Notifications.
2. **Asynchronous & Non-Blocking:** Email dispatch is completely asynchronous (via an transactional email outbox table and worker). Email transport failures never abort or roll back business transactions.
3. **Notification Preferences:**
   - Users can configure their email notification preferences on a per-category basis.
   - All email categories are enabled by default for new users.
   - In-app notifications are mandatory and cannot be disabled.
4. **Triggered Booking Events:**
   - `BOOKING_SUBMITTED`: Alert to Owner (incoming request).
   - `BOOKING_APPROVED`: Alert to Tenant (request accepted).
   - `BOOKING_REJECTED`: Alert to Tenant (request declined).
   - `BOOKING_CANCELLED`: Alert to counterpart (cancelled by Tenant or Owner).
   - `BOOKING_EXPIRED`: Alert to Tenant (request timed out after 72 hours).
   - `CHANGE_REQUEST_SUBMITTED`: Alert to Owner (period change requested).
   - `CHANGE_REQUEST_APPROVED`: Alert to Tenant (new dates confirmed).
   - `CHANGE_REQUEST_REJECTED`: Alert to Tenant (change declined with reason).
   - `CHANGE_REQUEST_CANCELLED`: Alert to Owner (tenant withdrew change request).

---

### 3.5. Property Reporting

To maintain trust, compliance, and accurate listings, Kostly provides an integrated property reporting workflow.

1. **Report Submission:**
   - A Tenant can submit a report against any property.
   - **Report Mode:**
     - **Identified Report:** Records `reporter_id` referencing the Tenant's profile.
     - **Anonymous Report:** `reporter_id` is stored as `NULL` in the database.
   - **Absolute Reporter Confidentiality:** The Owner **never** sees the reporter's identity under any circumstances (stripped by the API layer for identified reports, absent for anonymous).
   - A Tenant may file multiple separate reports for the same property without restriction.
2. **Report Status Lifecycle:**
   - `SUBMITTED`: Newly filed report awaiting operator review.
   - `UNDER_REVIEW`: Report is currently being evaluated by Kostly operators in Supabase Studio.
   - `RESOLVED`: Violation verified and remediated.
   - `DISMISSED`: Report rejected as invalid, false, or unsubstantiated.
   - `CANCELLED`: Report withdrawn by the filing Tenant.
3. **Tenant Report Capabilities:**
   - Can view only their own filed reports, including status changes, operator follow-up notes, and attachments.
   - Can cancel a report **only while status is `SUBMITTED`** (transitions to `CANCELLED`).
   - Can edit report category and description **only while status is `SUBMITTED`**. Once `UNDER_REVIEW`, content is permanently locked.
4. **Operator Follow-up Notes:**
   - Operator records notes when transitioning a report to `RESOLVED` or `DISMISSED`.
   - Follow-up note is optional for `RESOLVED`, but **mandatory for `DISMISSED`**.
   - Visible to the Tenant. Read-only for the Owner.
5. **Owner Report Access & Responses:**
   - Owner can inspect reports filed against their own properties: category, description, status, submitted timestamp, status history timestamps, proof photos, and Owner's own responses.
   - Owner cannot view reporter identity, change report status, edit operator follow-up notes, or download proof photos.
   - Owner does not receive automated notifications upon new report creation (avoids retaliatory confrontation).
   - **Owner Responses:** Owner may submit multiple separate written statements to a report.
     - Responses are private between Owner and Kostly operators (never visible to Tenant).
     - Owner can edit or delete their response while the report is `SUBMITTED` or `UNDER_REVIEW`.
     - Responses are locked once the report is `RESOLVED` or `DISMISSED`.
6. **Report Notifications:**
   - Tenant receives in-app and email notifications when report status changes to `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`, or `CANCELLED`.
   - `RESOLVED` and `DISMISSED` alerts include the operator follow-up note.
7. **Report Proof Photos:**
   - Optional, up to **3 images** per report.
   - Stored in a private Supabase Storage bucket; access served via time-limited signed URLs.
   - Tenant can add, replace, or delete photos only while status is `SUBMITTED`. Locked thereafter.
   - Deleted or replaced photos must be cleaned up from storage.

---

## 4. Non-Functional Requirements & Security

1. **Zero Client Trust:** Client-submitted roles, prices, dates, or ownership IDs are never trusted. The backend verifies all claims and recalculates all totals.
2. **Concurrency Safety:** Room approval and change request approval execute inside database transactions with row-level locks and PostgreSQL GiST exclusion constraints to guarantee zero overlapping approved bookings.
3. **Private Storage Protection:** Property and room listing photos may use public CDNs; report proof attachments and user identity avatars strictly use private buckets with signed URL access.
4. **Auditability:** Critical state transitions record timestamps and actor UUIDs (`cancelled_by`, `decided_at`).

---

## 5. Out of Scope for MVP

- In-app payment processing, virtual accounts, credit cards, or automated escrow.
- In-app chat, audio/video calling.
- Tenant reviews, ratings, and public comments.
- Daily, weekly, or custom non-monthly rental durations.
- Automated multi-currency conversions (all IDR).
- Custom Admin Dashboard application (managed via Supabase Studio).
- Multi-member owner teams or agency role hierarchies.
