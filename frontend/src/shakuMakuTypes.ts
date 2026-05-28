export type Language = 'ar' | 'ku' | 'en';

export type GovernorateCode = 'all' | 'baghdad' | 'erbil' | 'basra' | 'sulaymaniyah' | 'najaf' | 'mosul' | 'karbala' | 'kirkuk' | 'anbar' | 'duhok' | 'babil' | 'diyala' | 'wasit' | 'saladin' | 'maysan' | 'dhiqar' | 'muthanna' | 'qadisiya' | 'halabja';

export interface Governorate {
  code: GovernorateCode;
  name: {
    ar: string;
    ku: string;
    en: string;
  };
  englishLabel: string;
}

export interface Category {
  id: string;
  icon: string;
  name: {
    ar: string;
    ku: string;
    en: string;
  };
  color: string;
}

export interface Business {
  id: string;
  name: {
    ar: string;
    ku: string;
    en: string;
  };
  description: {
    ar: string;
    ku: string;
    en: string;
  };
  category: string;
  governorate: GovernorateCode;
  rating: number;
  reviewsCount: number;
  image: string;
  images: string[];
  avatar: string;
  isVerified: boolean;
  phoneNumber?: string;
  address: {
    ar: string;
    ku: string;
    en: string;
  };
  likes: number;
  saves: number;
  likedByUser?: boolean;
  savedByUser?: boolean;
  featuredDeal?: {
    ar: string;
    ku: string;
    en: string;
  };
  mapCoords: { x: number; y: number }; // percentage on interactive canvas map
  stories?: string[]; // short active stories
  ownerUid?: string; // Firebase Authentication owner ID
}

export interface SocialPost {
  id: string;
  businessId: string;
  businessName: string;
  businessAvatar: string;
  category: string;
  governorate: GovernorateCode;
  mediaUrl: string;
  caption: {
    ar: string;
    ku: string;
    en: string;
  };
  likes: number;
  commentsCount: number;
  shares: number;
  views?: number;
  timeAgo: {
    ar: string;
    ku: string;
    en: string;
  };
  likedByUser?: boolean;
  savedByUser?: boolean;
  comments: Comment[];
  promotionBadge?: {
    ar: string;
    ku: string;
    en: string;
  };
  videoUrl?: string;
  fileAttachment?: {
    name: string;
    size: string;
    type?: string;
  };
  authorUid?: string; // Firebase Authentication author ID
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  createdAt: string;
  role?: 'user' | 'owner' | 'admin';
  onboarded?: boolean;
  businessId?: string | null;
  businessOnboarding?: {
    name: string;
    category: string;
    governorate: GovernorateCode;
    address: string;
    phone: string;
    whatsApp: string;
    logo: string;
    coverImage: string;
    description: string;
    facebook?: string;
    instagram?: string;
  };
}

export interface Comment {
  id: string;
  username: string;
  userAvatar?: string;
  text: string;
  time: string;
}

export interface HeroSlide {
  id: string;
  image: string;
  slogan: {
    ar: string;
    ku: string;
    en: string;
  };
  governorate: GovernorateCode;
  category: string;
  badge: {
    ar: string;
    ku: string;
    en: string;
  };
}

export interface BusinessClaim {
  id: string;
  businessId: string;
  businessName: {
    ar: string;
    ku: string;
    en: string;
  };
  userId: string;
  userPhone: string;
  status: 'pending' | 'approved' | 'rejected';
  isSuspicious: boolean;
  suspiciousReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface BusinessOwnerRecord {
  id: string;
  userId: string;
  businessId: string;
  role: 'owner' | 'manager' | 'staff';
  verified: boolean;
  createdAt: string;
}
