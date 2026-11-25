export type UserRole = 'TENANT' | 'OWNER';

export type KostGenderType = 'CAMPUR' | 'PUTRA' | 'PUTRI';

export type PropertyStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type RoomStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface UserProfile {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  whatsappAlerts: boolean;
}

export interface RoomItem {
  id: string;
  propertyId: string;
  name: string;
  description: string;
  monthlyPrice: number;
  capacity: number;
  status: RoomStatus;
  highlights: string[];
  availableCount: number;
}

export interface PropertyItem {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  landmark?: string;
  city: string;
  province: string;
  genderType: KostGenderType;
  status: PropertyStatus;
  verified: boolean;
  popularTag?: string;
  rating: number;
  reviewCount: number;
  photoCount: number;
  imageUrl: string;
  gallery: string[];
  startingPrice: number;
  facilities: string[];
  rooms: RoomItem[];
  hasBookingHistory: boolean;
}

export interface BookingItem {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyCity: string;
  propertyImage: string;
  roomId: string;
  roomName: string;
  tenantName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationMonths: number;
  monthlyPriceSnapshot: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  decisionNote?: string;
}
