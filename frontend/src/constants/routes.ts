import type { Href } from 'expo-router';

export const ROUTES = {
  home: '/' as Href,
  explore: '/explore' as Href,
  bookings: '/bookings' as Href,
  profile: '/profile' as Href,
  login: '/login' as Href,
  register: '/register' as Href,
  forgotPassword: '/forgot-password' as Href,
  ownerProperties: '/owner/properties' as Href,
  ownerPropertyNew: '/owner/properties/new' as Href,
  ownerPropertyEdit: (id: string): Href => ({
    pathname: '/owner/properties/[id]/edit',
    params: { id },
  }),
  propertyDetail: (id: string): Href => ({
    pathname: '/properties/[id]',
    params: { id },
  }),
} as const;
