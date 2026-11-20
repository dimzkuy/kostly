# Kostly — UI/UX Design Specification

**Version:** 1.2  
**Status:** Draft — design baseline  
**Last updated:** 20 November 2026

## 1. Design direction

Kostly uses a modern, clean, trustworthy interface suitable for a boarding-house marketplace. The visual identity is built around a blue primary palette, a light appearance, and neutral supporting colors.

The interface should feel approachable and practical rather than overly decorative. Prioritize clarity, readability, and confidence throughout property discovery and the booking process.

### Visual principles
- Use blue for primary actions, active navigation, links, and key interactive states.
- Use white and light neutral surfaces to keep the interface open and easy to scan.
- Use slate/gray neutrals for text, borders, muted surfaces, and supporting information.
- Reserve semantic colors for success, warning, danger, and informational states.
- Maintain consistent contrast and do not communicate status through color alone.
- Keep forms short and group related fields.
- Avoid excessive gradients, shadows, and decorative color blocks.

## 2. Color palette

### Brand and primary colors

| Token | Hex | Intended use |
|---|---|---|
| `primary-50` | `#EFF6FF` | Very light blue backgrounds and selected surfaces |
| `primary-100` | `#DBEAFE` | Subtle highlights and selected backgrounds |
| `primary-200` | `#BFDBFE` | Soft borders and decorative accents |
| `primary-300` | `#93C5FD` | Disabled or low-emphasis blue elements |
| `primary-400` | `#60A5FA` | Secondary emphasis |
| `primary-500` | `#3B82F6` | Brand blue for illustrations and selected accents |
| `primary-600` | `#2563EB` | Main primary color; buttons, links, active navigation |
| `primary-700` | `#1D4ED8` | Hover/pressed state |
| `primary-800` | `#1E40AF` | Strong emphasis |
| `primary-900` | `#1E3A8A` | Deep blue emphasis |

### Neutral colors

| Token | Hex | Intended use |
|---|---|---|
| `neutral-0` | `#FFFFFF` | Main cards and surfaces |
| `neutral-50` | `#F8FAFC` | App background |
| `neutral-100` | `#F1F5F9` | Subtle section backgrounds |
| `neutral-200` | `#E2E8F0` | Borders and dividers |
| `neutral-300` | `#CBD5E1` | Stronger borders and disabled controls |
| `neutral-400` | `#94A3B8` | Placeholder and tertiary icons |
| `neutral-500` | `#64748B` | Secondary text |
| `neutral-600` | `#475569` | Supporting text |
| `neutral-700` | `#334155` | Strong secondary text |
| `neutral-800` | `#1E293B` | Headings and primary text |
| `neutral-900` | `#0F172A` | Highest-emphasis text |

### Semantic colors

| Token | Hex | Intended use |
|---|---|---|
| `success-50` | `#F0FDF4` | Success background |
| `success-600` | `#16A34A` | Success text/icon |
| `warning-50` | `#FFFBEB` | Warning background |
| `warning-600` | `#D97706` | Warning text/icon |
| `danger-50` | `#FEF2F2` | Error background |
| `danger-600` | `#DC2626` | Error text/icon |
| `info-50` | `#EFF6FF` | Informational background |
| `info-600` | `#2563EB` | Informational text/icon |

### Initial theme mapping

| UI token | Color |
|---|---|
| `background` | `neutral-50` |
| `surface` | `neutral-0` |
| `surface-subtle` | `neutral-100` |
| `text-primary` | `neutral-900` |
| `text-secondary` | `neutral-600` |
| `text-muted` | `neutral-500` |
| `border` | `neutral-200` |
| `border-strong` | `neutral-300` |
| `primary` | `primary-600` |
| `primary-hover` | `primary-700` |
| `primary-pressed` | `primary-800` |
| `primary-subtle` | `primary-50` |
| `focus-ring` | `primary-500` |

Use the semantic theme tokens in components rather than scattering raw hex values throughout the application. This makes future palette adjustments easier.

## 3. Typography

Kostly uses two typefaces: **Manrope** for headings and **Inter** for subheadings, body text, and UI text.

| Role | Font family | Weight | Intended use |
|---|---|---|---|
| Heading | Manrope | 700 (Bold), 600 (SemiBold) | Screen titles, section headings, card titles, price emphasis |
| Subheading | Inter | 600 (SemiBold) | Subtitles, group labels, table headers |
| Body / paragraph | Inter | 400 (Regular) | Descriptions, paragraphs, hints, helper text |
| UI label | Inter | 500 (Medium) | Buttons, form labels, navigation labels, badges |

### Type scale (initial guidance)

| Style | Font | Size / line height |
|---|---|---|
| `heading-xl` | Manrope Bold | 32 / 40 |
| `heading-lg` | Manrope Bold | 24 / 32 |
| `heading-md` | Manrope SemiBold | 20 / 28 |
| `heading-sm` | Manrope SemiBold | 16 / 24 |
| `subheading` | Inter SemiBold | 14 / 20 |
| `body-lg` | Inter Regular | 16 / 24 |
| `body-md` | Inter Regular | 14 / 20 |
| `body-sm` | Inter Regular | 12 / 16 |
| `label` | Inter Medium | 14 / 20 |

### Implementation notes
- Load fonts with `expo-font` using `@expo-google-fonts/manrope` and `@expo-google-fonts/inter`, and keep the splash screen visible until fonts are ready.
- In React Native, each weight is a separate font family (for example `Manrope_700Bold`, `Inter_400Regular`). Do not rely on `fontWeight` alone for custom fonts.
- Define font families and the type scale as shared typography tokens, alongside color, spacing, and radius.
- Use a system sans-serif fallback while fonts load or if loading fails.
- Use Manrope only for headings; do not use it for long paragraphs or dense form text.

## 4. Appearance mode

The initial product appearance is **Light mode**.

- Use `neutral-50` as the default application background.
- Use white surfaces for cards, forms, navigation panels, and dialogs.
- Use neutral text and border tokens for hierarchy.
- Do not implement a dark theme in the MVP unless it becomes a product requirement.
- Keep the token structure extensible so a dark theme can be introduced later without redesigning components.

## 5. Responsive application strategy

Kostly uses one Expo / React Native codebase for web, Android, and iOS. It is not a separate web application plus a separate mobile application.

Suggested responsive breakpoints:
- Mobile: below `768px`.
- Tablet: `768px` to `1023px`.
- Desktop: `1024px` and above.

Use `useWindowDimensions()` and responsive layout components/styles. Breakpoints are initial guidance, not rigid design constraints.

### Navigation behavior
- Mobile: bottom tab navigation for the primary areas.
- Tablet: compact navigation or adaptive side navigation.
- Desktop: persistent sidebar with a clear content area and optional top bar.

### Layout behavior
- Mobile: single-column content, stacked forms, touch-friendly controls, cards instead of dense tables.
- Tablet: two-column layouts where content permits.
- Desktop: wider content, multi-column detail pages, dashboard summaries, and data tables where useful.
- Avoid fixed widths that cause horizontal overflow.
- Keep important actions reachable on small screens.

## 6. Role-based information architecture

### Shared / authentication
- Welcome or role selection.
- Owner registration.
- Tenant registration.
- Sign in.
- Forgot password / password recovery.
- Profile.

### Tenant navigation
- Home: discovery highlights and recommended/latest listings.
- Explore: searchable and filterable property listings.
- Bookings: current and historical booking requests.
- Profile: personal information and account settings.

### Owner navigation
- Dashboard: property and booking summaries.
- Properties: list, create, edit, publish, archive.
- Bookings: incoming requests and booking history.
- Profile: owner information and account settings.

## 7. Main screens

### Authentication
- Make the Owner and Tenant registration paths explicit.
- Validate fields inline and explain errors in plain language.
- Show password visibility control.
- Do not expose role selection as a trusted client-side security mechanism; the backend must validate the stored role.

### Tenant home and explore
- Provide a prominent search entry point.
- Property cards should show a representative image, property name, area/location, starting monthly price, and concise highlights.
- Filters should be understandable and removable.
- Include loading skeletons, empty results, and retry states.

### Property detail
- Show a photo gallery, property name, address/area, facilities, description, and room list.
- Each room should show room name/type, monthly price, and current room status.
- Make the booking action clear without implying instant confirmation.

### Booking request
- Show selected property and room.
- Collect start date and duration in whole months.
- Display the calculated end date and price breakdown.
- Explain that the request requires owner approval.
- Explain that payment is arranged manually outside Kostly.

### Tenant bookings
- Group or filter bookings by status.
- Show requested period, property/room, total price snapshot, and latest status.
- Provide cancellation only when permitted by the booking state and business rules.

### Owner dashboard
- Show concise counts such as published properties, pending requests, and approved bookings.
- Provide shortcuts to add a property and review pending requests.
- Do not present financial totals as collected revenue because payment is manual and not verified by Kostly.

### Owner property management
- Use a clear create/edit flow.
- Separate property-level details from room-level details.
- Show draft/published/archived states.
- Confirm destructive or irreversible actions.

### Owner booking management
- Make pending requests easy to identify.
- Show tenant details permitted by the product, room, period, and price snapshot.
- Approval should have a confirmation step and explain that the room period will be reserved.
- Rejection should optionally collect a reason if that feature is implemented.

## 8. Shared component inventory

- `Button`: primary, secondary, outline, danger, loading, disabled.
- `TextField`: label, hint, validation message, secure entry.
- `SelectField` / picker.
- `DateField`.
- `PropertyCard`.
- `RoomCard`.
- `BookingCard`.
- `StatusBadge`.
- `ImageGallery`.
- `ScreenHeader`.
- `EmptyState`.
- `LoadingState` / skeleton.
- `ErrorState`.
- `ConfirmDialog` / platform-appropriate confirmation UI.
- `ResponsiveContainer`.
- `AppSidebar` and `MobileTabBar`.

Build reusable components around repeated behavior, not every one-off visual element.

## 9. Status presentation

Use text labels alongside color so status is not communicated by color alone.

| Domain | Status | Suggested label |
|---|---|---|
| Property | `DRAFT` | Draft |
| Property | `PUBLISHED` | Published |
| Property | `ARCHIVED` | Archived |
| Room | `ACTIVE` | Active |
| Room | `INACTIVE` | Inactive |
| Room | `MAINTENANCE` | Maintenance |
| Booking | `PENDING` | Waiting for owner |
| Booking | `APPROVED` | Approved |
| Booking | `REJECTED` | Rejected |
| Booking | `CANCELLED` | Cancelled |
| Booking | `EXPIRED` | Expired |
| Report | `SUBMITTED` | Submitted |
| Report | `UNDER_REVIEW` | Under review |
| Report | `RESOLVED` | Resolved |
| Report | `DISMISSED` | Dismissed |
| Report | `CANCELLED` | Cancelled |

## 10. Accessibility and usability

- Maintain sufficient text/background contrast.
- Provide labels for form controls and accessible names for icon-only buttons.
- Support keyboard navigation on web.
- Use appropriate touch target sizes on mobile.
- Do not rely on hover as the only way to reveal actions.
- Respect platform safe areas and system text scaling where practical.
- Keep validation messages adjacent to the relevant fields.

## 11. Design implementation notes

- Define shared design tokens for color, spacing, typography (Manrope for headings, Inter for subheadings and body), and radius.
- Prefer platform-neutral components from React Native where possible.
- Use platform-specific files only when behavior genuinely differs.
- Verify the same key flows at mobile, tablet, and desktop viewport sizes.
- Keep business rules out of visual components; call typed feature/service functions instead.
