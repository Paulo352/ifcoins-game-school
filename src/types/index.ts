
export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  ra?: string;
  class?: string;
  coins: number;
  collection: Record<string, number>;
  trades?: {
    received: Record<string, boolean>;
    sent: Record<string, boolean>;
  };
}

export type CardRarity = 'common' | 'rare' | 'legendary' | 'mythic' | 'epic';

export interface Card {
  id: string;
  name: string;
  rarity: CardRarity;
  imageUrl: string;
  available: boolean;
  copiesAvailable?: number;
  eventId?: string;
  description?: string;
  price: number; // Preço em IFCoins
}

export interface Pack {
  id: string;
  name: string;
  available: boolean;
  limitPerStudent: number;
  price: number;
  cardProbabilities: Record<CardRarity, number>;
}

export interface SchoolEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  bonusMultiplier: number;
  cards: string[];
  description?: string;
}

export interface Trade {
  id: string;
  from: string;
  to: string;
  offered: {
    cards: Record<string, number>;
    coins: number;
  };
  requested: {
    cards: Record<string, number>;
    coins: number;
  };
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface RewardLog {
  id: string;
  teacherId: string;
  studentId: string;
  coins: number;
  timestamp: number;
  reason: string;
}
