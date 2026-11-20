-- ============================================================================
-- Kostly Database Initial Migration (Down)
-- Database: PostgreSQL (Supabase)
-- Version: 000001
-- ============================================================================

-- 1. Drop Triggers on Auth and Public Tables
DROP TRIGGER IF EXISTS trg_create_initial_report_status_history ON public.property_reports;
DROP TRIGGER IF EXISTS trg_prevent_property_deletion_with_history ON public.properties;
DROP TRIGGER IF EXISTS trg_prevent_booking_history_reversal ON public.properties;
DROP TRIGGER IF EXISTS trg_set_property_booking_history ON public.bookings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop Trigger Functions
DROP FUNCTION IF EXISTS public.trg_fn_create_initial_report_status_history();
DROP FUNCTION IF EXISTS public.trg_fn_prevent_property_deletion_with_history();
DROP FUNCTION IF EXISTS public.trg_fn_prevent_booking_history_reversal();
DROP FUNCTION IF EXISTS public.trg_fn_set_property_booking_history();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Drop Application Tables (in reverse dependency order)
DROP TABLE IF EXISTS public.property_report_owner_responses CASCADE;
DROP TABLE IF EXISTS public.property_report_status_histories CASCADE;
DROP TABLE IF EXISTS public.property_report_images CASCADE;
DROP TABLE IF EXISTS public.property_reports CASCADE;
DROP TABLE IF EXISTS public.email_outbox CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.booking_change_requests CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.room_images CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.property_facilities CASCADE;
DROP TABLE IF EXISTS public.property_images CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Note: btree_gist extension is intentionally preserved as it may be
-- utilized by other Supabase database objects or extensions.
