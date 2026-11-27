import React, { createContext, useContext, useMemo, useState } from 'react';

import { DEFAULT_USER, INITIAL_BOOKINGS, MOCK_PROPERTIES } from '@/data/mock-data';
import type { BookingItem, PropertyItem, UserProfile, UserRole } from '@/types/kostly';

interface AppContextValue {
  user: UserProfile;
  isAuthenticated: boolean;
  properties: PropertyItem[];
  wishlistIds: string[];
  bookings: BookingItem[];
  unreadNotifications: number;
  login: (params: { email: string; role: UserRole }) => void;
  register: (params: { fullName: string; email: string; role: UserRole }) => void;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
  updateProfile: (params: { fullName: string; email: string; phone: string }) => void;
  toggleWhatsappAlerts: () => void;
  toggleWishlist: (propertyId: string) => void;
  createBookingRequest: (params: {
    property: PropertyItem;
    roomId: string;
    startDate: string;
    durationMonths: number;
  }) => BookingItem;
  updateBookingStatus: (bookingId: string, status: BookingItem['status'], note?: string) => void;
  addOwnerProperty: (property: PropertyItem) => void;
  updateOwnerProperty: (property: PropertyItem) => void;
  clearUnreadNotifications: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function computeCalendarEndDate(startDateStr: string, durationMonths: number): string {
  const [y, m, d] = startDateStr.split('-').map(Number);
  if (!y || !m || !d) return startDateStr;
  const targetMonthIndex = m - 1 + durationMonths;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDayOfTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const clampedDay = Math.min(d, lastDayOfTargetMonth);
  const mm = String(normalizedMonth + 1).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'KO';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [properties, setProperties] = useState<PropertyItem[]>(MOCK_PROPERTIES);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['prop-senopati-01', 'prop-kebayoran-02']);
  const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [unreadNotifications, setUnreadNotifications] = useState(2);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      isAuthenticated,
      properties,
      wishlistIds,
      bookings,
      unreadNotifications,
      login: ({ email, role }) => {
        const cleanEmail = email.trim() || DEFAULT_USER.email;
        const derivedName =
          cleanEmail === DEFAULT_USER.email
            ? DEFAULT_USER.fullName
            : cleanEmail
                .split('@')[0]
                .replace(/[._-]+/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
        setUser((prev) => ({
          ...prev,
          email: cleanEmail,
          fullName: derivedName,
          initials: getInitials(derivedName),
          role,
        }));
        setIsAuthenticated(true);
      },
      register: ({ fullName, email, role }) => {
        const name = fullName.trim() || DEFAULT_USER.fullName;
        setUser((prev) => ({
          ...prev,
          fullName: name,
          initials: getInitials(name),
          email: email.trim() || DEFAULT_USER.email,
          role,
        }));
      },
      logout: () => {
        setIsAuthenticated(false);
      },
      switchDemoRole: (role) => {
        setUser((prev) => ({ ...prev, role }));
      },
      updateProfile: ({ fullName, email, phone }) => {
        setUser((prev) => {
          const cleanName = fullName.trim() || prev.fullName;
          return {
            ...prev,
            fullName: cleanName,
            initials: getInitials(cleanName),
            email: email.trim() || prev.email,
            phone: phone.trim() || prev.phone,
          };
        });
      },
      toggleWhatsappAlerts: () => {
        setUser((prev) => ({ ...prev, whatsappAlerts: !prev.whatsappAlerts }));
      },
      toggleWishlist: (propertyId) => {
        setWishlistIds((prev) =>
          prev.includes(propertyId)
            ? prev.filter((id) => id !== propertyId)
            : [...prev, propertyId]
        );
      },
      createBookingRequest: ({ property, roomId, startDate, durationMonths }) => {
        if (user.role === 'OWNER') {
          throw new Error('Pemilik kost tidak diperbolehkan mengajukan sewa.');
        }
        const room = property.rooms.find((r) => r.id === roomId) ?? property.rooms[0];
        const endDate = computeCalendarEndDate(startDate, durationMonths);
        const newBooking: BookingItem = {
          id: `bk-${Date.now()}`,
          propertyId: property.id,
          propertyName: property.name,
          propertyCity: `${property.city}, ${property.province}`,
          propertyImage: property.imageUrl,
          roomId: room.id,
          roomName: room.name,
          tenantName: user.fullName,
          startDate,
          endDate,
          durationMonths,
          monthlyPriceSnapshot: room.monthlyPrice,
          totalPrice: room.monthlyPrice * durationMonths,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        setBookings((prev) => [newBooking, ...prev]);
        return newBooking;
      },
      updateBookingStatus: (bookingId, status, note) => {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status, decisionNote: note ?? b.decisionNote } : b
          )
        );
      },
      addOwnerProperty: (property) => {
        setProperties((prev) => [property, ...prev]);
      },
      updateOwnerProperty: (property) => {
        setProperties((prev) => prev.map((p) => (p.id === property.id ? property : p)));
      },
      clearUnreadNotifications: () => {
        setUnreadNotifications(0);
      },
    }),
    [user, isAuthenticated, properties, wishlistIds, bookings, unreadNotifications]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
