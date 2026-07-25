import { api, convex } from './convexClient.ts';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface DriveTimeResult {
  distanceKm: number;
  durationMinutes: number;
  formattedDuration: string;
  formattedDistance: string;
  isEstimate: boolean;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  postalCode: string;
  fsa: string;
  driveTime: DriveTimeResult;
  isFallback: boolean;
  error?: string;
}

// Edmonton Fleet Hub (City Centre / Downtown)
export const EDMONTON_HUB = {
  lat: 53.5461,
  lng: -113.4938,
  name: 'Edmonton Fleet Hub',
};

/**
 * Calculates estimated drive time client-side using Haversine formula when Convex action is unavailable.
 */
export function estimateLocalDriveTime(destLat: number, destLng: number): DriveTimeResult {
  const R = 6371; // Earth radius in km
  const dLat = ((destLat - EDMONTON_HUB.lat) * Math.PI) / 180;
  const dLon = ((destLng - EDMONTON_HUB.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((EDMONTON_HUB.lat * Math.PI) / 180) *
      Math.cos((destLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = Math.round(R * c * 1.3 * 10) / 10;
  const minutes = Math.max(5, Math.round((km / 40) * 60 + 5));

  return {
    distanceKm: km,
    durationMinutes: minutes,
    formattedDuration: `~${minutes} min drive`,
    formattedDistance: `${km} km`,
    isEstimate: true,
  };
}

/**
 * Geocodes an address string through Convex action api.geo.geocodeAddress or local fallback.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (convex) {
    try {
      return await convex.action(api.geo.geocodeAddress, { address });
    } catch {
      // Fallback if Convex action fails
    }
  }

  // Pure client fallback for local demo mode
  const fsa = address.toUpperCase().replace(/\s/g, '').slice(0, 3);
  const synthLat = 53.54 + ((fsa.charCodeAt(2) || 65) % 10) * 0.015;
  const synthLng = -113.49 - ((fsa.charCodeAt(1) || 53) % 10) * 0.015;

  return {
    lat: synthLat,
    lng: synthLng,
    formattedAddress: `${address}, Edmonton, AB`,
    postalCode: fsa,
    fsa,
    driveTime: estimateLocalDriveTime(synthLat, synthLng),
    isFallback: true,
  };
}
