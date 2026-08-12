import type { PlaceCategoryId } from '@/constants/categories';

export type PlaceCategory = PlaceCategoryId;

export type TripIdeaStatus = 'active' | 'converted' | 'archived';
export type TripStatus = 'planned' | 'active' | 'completed';
export type PlacePriority = 'must' | 'optional' | 'interesting';
export type TripPlaceStatus = 'pending' | 'visited' | 'skipped';

export type Place = {
  id: number;
  name: string;
  city: string | null;
  description: string | null;
  category: PlaceCategory;
  latitude: number | null;
  longitude: number | null;
  visitLater: boolean;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlaceInput = {
  name: string;
  city?: string | null;
  description?: string | null;
  category: PlaceCategory;
  latitude?: number | null;
  longitude?: number | null;
  visitLater?: boolean;
  liked?: boolean;
};

export type TripIdea = {
  id: number;
  title: string;
  description: string | null;
  coverPhoto: string | null;
  status: TripIdeaStatus;
  createdAt: string;
  updatedAt: string;
};

export type TripIdeaInput = {
  title: string;
  description?: string | null;
  coverPhoto?: string | null;
  status?: TripIdeaStatus;
};

export type TripIdeaPlace = {
  id: number;
  ideaId: number;
  placeId: number;
  sortOrder: number;
  priority: PlacePriority;
  notes: string | null;
  createdAt: string;
};

export type TripIdeaPlaceInput = {
  placeId: number;
  sortOrder: number;
  priority?: PlacePriority;
  notes?: string | null;
};

export type Trip = {
  id: number;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: TripStatus;
  current: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TripInput = {
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: TripStatus;
  current?: boolean;
};

export type TripPlace = {
  id: number;
  tripId: number;
  placeId: number;
  sortOrder: number;
  dayNumber: number | null;
  status: TripPlaceStatus;
  visitDate: string | null;
  liked: boolean;
  notes: string | null;
  priority: PlacePriority;
  createdAt: string;
  updatedAt: string;
};

export type TripPlaceInput = {
  placeId: number;
  sortOrder: number;
  dayNumber?: number | null;
  status?: TripPlaceStatus;
  visitDate?: string | null;
  liked?: boolean;
  notes?: string | null;
  priority?: PlacePriority;
};

export type Photo = {
  id: number;
  uri: string;
  placeId: number | null;
  tripPlaceId: number | null;
  createdAt: string;
};

export type PhotoInput = {
  uri: string;
  placeId?: number | null;
  tripPlaceId?: number | null;
};
