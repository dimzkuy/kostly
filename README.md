# Kostly

**Kostly** is a boarding house discovery and booking platform designed to make renting and managing boarding rooms (*kost*) easier, more organized, and more transparent in Indonesia.

The platform connects boarding house owners with prospective tenants through a centralized system, simplifying property discovery, room bookings, and property management.

## Who Does Kostly Help?

Kostly is designed for two primary user groups:

- **Boarding House Owners** — Helps owners manage property listings, room information, booking requests, and tenant-reported property issues without relying on scattered manual processes.
- **Prospective Tenants** — Helps tenants discover boarding houses, explore room details, submit booking requests, and communicate property-related issues through one platform.

## MVP Scope

The Minimum Viable Product (MVP) focuses on the core processes involved in discovering, renting, and managing boarding rooms.

### 1. Property Discovery
- Browse published boarding house listings.
- View property details, facilities, and room information.
- Explore available rooms and their pricing.

### 2. Booking Management
- Submit room booking requests.
- Owner approval and rejection workflows.
- Request booking changes.
- Handle booking cancellations and booking status updates.

### 3. Property Management
- Manage property listings and room information.
- Manage facilities and property images.
- Track and manage incoming booking requests.

### 4. Property Issue Reporting
- Submit property-related reports with optional photo attachments.
- Support anonymous and identified reports.
- Track report status and status history.
- Allow owners to view reports and provide responses.

### 5. Notifications
- In-app notifications for important activities.
- Email notifications for relevant booking and report updates.
- Notification preferences for email delivery.

## Technical Challenges

Kostly involves several engineering challenges beyond basic CRUD operations:

- **Booking Consistency** — Preventing overlapping approved bookings while handling concurrent booking requests and changes.
- **Role-Based Access Control** — Ensuring owners and tenants can only access data permitted by their roles and ownership relationships.
- **Database Security** — Implementing PostgreSQL Row-Level Security (RLS), database constraints, and controlled access to sensitive information.
- **Booking Lifecycle Management** — Handling booking approvals, rejections, modifications, cancellations, and expiration consistently.
- **Anonymous Reporting** — Supporting anonymous reports while retaining the ability to associate reports with their creators for access control.
- **File Access Control** — Managing private report photo storage and restricting access according to report ownership and property relationships.
- **Data Integrity** — Maintaining consistent relationships between properties, rooms, bookings, reports, and their associated records.

## Technology

- **Frontend:** React Native, Expo, TypeScript
- **Backend:** Go, Gin
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage

---

*Kostly — Simplifying boarding house discovery and management.*
