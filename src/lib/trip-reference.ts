import type { Trip } from '@/contexts/AppContext';

function compactDate(value?: string): string {
  if (!value) return '00000000';
  const [datePart] = value.split('T');
  const compact = datePart.replace(/\D/g, '');
  return compact.length >= 8 ? compact.slice(0, 8) : compact.padEnd(8, '0');
}

function compactId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0');
}

export function getTripReference(trip: Pick<Trip, 'id' | 'dateDepart'>): string {
  return `TRJ-${compactDate(trip.dateDepart)}-${compactId(trip.id)}`;
}

export function getTripLabel(
  trip: Pick<Trip, 'id' | 'dateDepart' | 'origine' | 'destination' | 'client'>,
): string {
  const client = trip.client ? ` - ${trip.client}` : '';
  return `${getTripReference(trip)} - ${trip.origine} -> ${trip.destination}${client}`;
}
