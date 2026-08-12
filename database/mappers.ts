import type { SQLiteDatabase } from 'expo-sqlite';
import {
  Place,
  Photo,
  PlaceCategory,
  PlacePriority,
  Trip,
  TripIdea,
  TripIdeaPlace,
  TripIdeaStatus,
  TripPlace,
  TripPlaceStatus,
  TripStatus,
} from '@/types';
import { intToBool } from './helpers';

type PlaceRow = {
  id: number;
  name: string;
  city: string | null;
  description: string | null;
  category: string;
  latitude: number | null;
  longitude: number | null;
  visit_later: number;
  liked: number;
  created_at: string;
  updated_at: string;
};

type TripIdeaRow = {
  id: number;
  title: string;
  description: string | null;
  cover_photo: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type TripIdeaPlaceRow = {
  id: number;
  idea_id: number;
  place_id: number;
  sort_order: number;
  priority: string;
  notes: string | null;
  created_at: string;
};

type TripRow = {
  id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  current: number;
  created_at: string;
  updated_at: string;
};

type TripPlaceRow = {
  id: number;
  trip_id: number;
  place_id: number;
  sort_order: number;
  day_number: number | null;
  status: string;
  visit_date: string | null;
  liked: number;
  notes: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
};

type PhotoRow = {
  id: number;
  uri: string;
  place_id: number | null;
  trip_place_id: number | null;
  created_at: string;
};

export function mapPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    description: row.description,
    category: row.category as PlaceCategory,
    latitude: row.latitude,
    longitude: row.longitude,
    visitLater: intToBool(row.visit_later),
    liked: intToBool(row.liked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTripIdea(row: TripIdeaRow): TripIdea {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverPhoto: row.cover_photo,
    status: row.status as TripIdeaStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTripIdeaPlace(row: TripIdeaPlaceRow): TripIdeaPlace {
  return {
    id: row.id,
    ideaId: row.idea_id,
    placeId: row.place_id,
    sortOrder: row.sort_order,
    priority: row.priority as PlacePriority,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function mapTrip(row: TripRow): Trip {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as TripStatus,
    current: intToBool(row.current),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTripPlace(row: TripPlaceRow): TripPlace {
  return {
    id: row.id,
    tripId: row.trip_id,
    placeId: row.place_id,
    sortOrder: row.sort_order,
    dayNumber: row.day_number,
    status: row.status as TripPlaceStatus,
    visitDate: row.visit_date,
    liked: intToBool(row.liked),
    notes: row.notes,
    priority: row.priority as PlacePriority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    uri: row.uri,
    placeId: row.place_id,
    tripPlaceId: row.trip_place_id,
    createdAt: row.created_at,
  };
}

export type {
  PlaceRow,
  TripIdeaRow,
  TripIdeaPlaceRow,
  TripRow,
  TripPlaceRow,
  PhotoRow,
};

/** Ensure foreign_keys for each connection (SQLite resets per connection). */
export async function enableForeignKeys(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON');
}
