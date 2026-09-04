export interface CMSSettings {
  heroTagline: string;
  baseSessionRate: number;
  weeklyPackRate: number;
  eightPackRate: number;
  emergencyBannerText: string;
  emergencyBannerActive: boolean;
}

export const DEFAULT_CMS: CMSSettings = {
  heroTagline: 'A Professional Dog Gym That Comes to You',
  baseSessionRate: 35,
  weeklyPackRate: 110,
  eightPackRate: 200,
  emergencyBannerText: '',
  emergencyBannerActive: false,
};

export interface FSARecord {
  id: string;
  fsa: string;
  city: string;
  province: string;
  tier: 'Tier 1' | 'Tier 2';
  surcharge: number;
  status: 'active' | 'pending' | 'inactive';
  region?: 'East' | 'North' | 'West' | 'South';
  createdAt: string;
}

export interface VaccineRecord {
  id: string;
  dogName: string;
  ownerName: string;
  vaccineType: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FleetVan {
  id: string;
  name: string;
  status: 'Active' | 'Maintenance' | 'Offline';
  location: string;
  sessionsToday: number;
  totalSessions: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId?: string;
  vanId: string;
  fsa: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
  dogName: string;
  dogBreed?: string;
  dogWeight?: number;
  dogAge?: number;
  dogEnergy?: string;
  date: string;
  timeSlot?: string;
  planName?: string;
  sessionFee: number;
  surcharge: number;
  status: 'completed' | 'cancelled' | 'scheduled' | 'pending_payment';
  createdAt: string;
}

export interface UserAddress {
  line1: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface UserDog {
  name: string;
  breed: string;
  weight: number;
  age: number;
  energyLevel: string;
  reactivityNotes: string;
  photoUrl?: string;
}

export interface UserVaccines {
  rabiesFileName: string;
  dhppFileName: string;
  vetName: string;
  vetPhone: string;
  status?: 'pending' | 'approved' | 'rejected';
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  documentUrl?: string | null;
  documentType?: 'pdf' | 'image' | string;
}

export interface Payment {
  id: string;
  userId: string | null;
  planKey: string;
  planName: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  sessionsCount?: number;
  status: 'checkout_created' | 'paid' | 'cancelled' | 'failed' | 'refunded';
  createdAt: string;
}

export interface User {
  id: string;
  authProviderUserId?: string;
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  role: 'customer' | 'admin';
  name: string;
  phone: string;
  address: UserAddress;
  dog: UserDog;
  vaccines: UserVaccines;
  legalAccepted: boolean;
  legalAcceptedAt: string | null;
  legalVersion?: string;
  profileCompleted?: boolean;
  profileSubmittedAt?: string | null;
  accountVerified?: boolean;
  accountVerifiedAt?: string | null;
  accountVerifiedBy?: string | null;
  assignedSessionDate?: string;
  assignedTimeSlot?: string;
  assignedNotes?: string;
  callConfirmed?: boolean;
  callConfirmedAt?: string | null;
  assignedBy?: string | null;
  hasPaid?: boolean;
  paidAt?: string | null;
  paidPlanName?: string | null;
  createdAt: string;
}
