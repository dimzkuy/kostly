-- ============================================================================
-- Kostly Database Initial Migration (Up)
-- Database: PostgreSQL (Supabase)
-- Version: 000001
-- ============================================================================

-- 1. PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- 2. Core Entities
-- ============================================================================

-- Profiles Table (corresponds 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'TENANT')),
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Facilities Catalog Table
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    latitude NUMERIC CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    longitude NUMERIC CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    has_booking_history BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status_city ON public.properties(status, city);
CREATE INDEX IF NOT EXISTS idx_properties_booking_history ON public.properties(has_booking_history);

-- Property Images Table
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_sort ON public.property_images(property_id, sort_order ASC);

-- Property Facilities Junction Table
CREATE TABLE IF NOT EXISTS public.property_facilities (
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
    PRIMARY KEY (property_id, facility_id)
);

CREATE INDEX IF NOT EXISTS idx_property_facilities_facility_id ON public.property_facilities(facility_id);

-- Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    monthly_price BIGINT NOT NULL CHECK (monthly_price > 0),
    capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_property_status ON public.rooms(property_id, status);

-- Room Images Table
CREATE TABLE IF NOT EXISTS public.room_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_images_room_sort ON public.room_images(room_id, sort_order ASC);

-- ============================================================================
-- 3. Booking Entities
-- ============================================================================

-- Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    monthly_price_snapshot BIGINT NOT NULL CHECK (monthly_price_snapshot > 0),
    total_price BIGINT NOT NULL CHECK (total_price > 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    decision_note TEXT,
    decided_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_bookings_end_after_start CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_created ON public.bookings(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_room_status_dates ON public.bookings(room_id, status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_pending_expiration ON public.bookings(status, created_at) WHERE status = 'PENDING';

-- Exclusion Constraint: Prevent overlapping APPROVED bookings on the same room
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_no_overlapping_approved
EXCLUDE USING gist (
    room_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
) WHERE (status = 'APPROVED');

-- Exclusion Constraint: Prevent duplicate active (PENDING or APPROVED) bookings by the same tenant on the same room
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_no_duplicate_tenant_active
EXCLUDE USING gist (
    tenant_id WITH =,
    room_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
) WHERE (status IN ('PENDING', 'APPROVED'));

-- Booking Change Requests Table
CREATE TABLE IF NOT EXISTS public.booking_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    requested_start_date DATE NOT NULL,
    requested_end_date DATE NOT NULL,
    requested_duration_months INTEGER NOT NULL CHECK (requested_duration_months > 0),
    new_monthly_price_snapshot BIGINT NOT NULL CHECK (new_monthly_price_snapshot > 0),
    new_total_price BIGINT NOT NULL CHECK (new_total_price > 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    rejection_reason TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_change_requests_end_after_start CHECK (requested_end_date > requested_start_date)
);

-- Partial Unique Index: Exactly one active pending change request per booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_change_requests_single_pending
ON public.booking_change_requests(booking_id)
WHERE status = 'PENDING';

-- ============================================================================
-- 4. Notification Entities
-- ============================================================================

-- In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at, created_at DESC);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_notification_preferences_user_category UNIQUE (user_id, category)
);

-- Email Outbox Table (Transactional Outbox Pattern)
CREATE TABLE IF NOT EXISTS public.email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'SKIPPED')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_pending ON public.email_outbox(status, created_at) WHERE status = 'PENDING';

-- ============================================================================
-- 5. Property Reporting Entities
-- ============================================================================

-- Property Reports Table
CREATE TABLE IF NOT EXISTS public.property_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'CANCELLED')),
    follow_up_note TEXT,
    resolved_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_property_reports_anonymous_consistency CHECK (
        (is_anonymous = true AND reporter_id IS NULL) OR
        (is_anonymous = false AND reporter_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_property_reports_property ON public.property_reports(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_reports_reporter ON public.property_reports(reporter_id, created_at DESC) WHERE reporter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_property_reports_status ON public.property_reports(status);

-- Property Report Images Table (Max 3 proof photos via slot constraint)
CREATE TABLE IF NOT EXISTS public.property_report_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.property_reports(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL CHECK (sort_order BETWEEN 1 AND 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_property_report_images_slot UNIQUE (report_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_report_images_report ON public.property_report_images(report_id, sort_order ASC);

-- Property Report Status Histories Table
CREATE TABLE IF NOT EXISTS public.property_report_status_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.property_reports(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    note TEXT,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_history_report ON public.property_report_status_histories(report_id, created_at ASC);

-- Property Report Owner Responses Table
CREATE TABLE IF NOT EXISTS public.property_report_owner_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.property_reports(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_owner_responses_report ON public.property_report_owner_responses(report_id, created_at ASC);

-- ============================================================================
-- 6. Functions & Triggers: Supabase Auth & Business Invariants
-- ============================================================================

-- A. Profile Provisioning Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    assigned_role pg_catalog.text;
    user_full_name pg_catalog.text;
BEGIN
    assigned_role := NEW.raw_user_meta_data->>'role';
    user_full_name := pg_catalog.coalesce(pg_catalog.nullif(pg_catalog.btrim(NEW.raw_user_meta_data->>'full_name'), ''), 'User');

    -- Strictly validate role; reject registration if role is missing or invalid
    IF assigned_role IS NULL OR assigned_role NOT IN ('OWNER', 'TENANT') THEN
        RAISE EXCEPTION 'Registration rejected: valid role (OWNER or TENANT) is required.';
    END IF;

    INSERT INTO public.profiles (id, role, full_name, created_at, updated_at)
    VALUES (NEW.id, assigned_role, user_full_name, pg_catalog.now(), pg_catalog.now());

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B. Trigger: Automatically activate properties.has_booking_history on first booking
CREATE OR REPLACE FUNCTION public.trg_fn_set_property_booking_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.properties
    SET has_booking_history = true
    WHERE id = (SELECT property_id FROM public.rooms WHERE id = NEW.room_id)
      AND has_booking_history = false;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_property_booking_history ON public.bookings;
CREATE TRIGGER trg_set_property_booking_history
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_set_property_booking_history();

-- C. Trigger: Prevent properties.has_booking_history from reverting to false
CREATE OR REPLACE FUNCTION public.trg_fn_prevent_booking_history_reversal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF OLD.has_booking_history = true AND NEW.has_booking_history = false THEN
        RAISE EXCEPTION 'Illegal state transition: has_booking_history cannot be reverted to false';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_booking_history_reversal ON public.properties;
CREATE TRIGGER trg_prevent_booking_history_reversal
BEFORE UPDATE OF has_booking_history ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_prevent_booking_history_reversal();

-- D. Trigger: Prevent hard-deletion of property if has_booking_history is true
CREATE OR REPLACE FUNCTION public.trg_fn_prevent_property_deletion_with_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF OLD.has_booking_history = true THEN
        RAISE EXCEPTION 'Deletion rejected: property has historical booking records and cannot be deleted';
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_property_deletion_with_history ON public.properties;
CREATE TRIGGER trg_prevent_property_deletion_with_history
BEFORE DELETE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_prevent_property_deletion_with_history();

-- E. Trigger: Record initial SUBMITTED status history for newly created property reports
CREATE OR REPLACE FUNCTION public.trg_fn_create_initial_report_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.property_report_status_histories (
        id,
        report_id,
        from_status,
        to_status,
        note,
        changed_by,
        created_at
    ) VALUES (
        pg_catalog.gen_random_uuid(),
        NEW.id,
        NULL,
        'SUBMITTED',
        'Laporan berhasil dibuat',
        NULL,
        NEW.created_at
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_initial_report_status_history ON public.property_reports;
CREATE TRIGGER trg_create_initial_report_status_history
AFTER INSERT ON public.property_reports
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_create_initial_report_status_history();
