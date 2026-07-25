import { v } from "convex/values";
import { action } from "./_generated/server.js";

// Default Edmonton Fleet Depot location (City Centre / Downtown Edmonton)
export const EDMONTON_DEPOT = {
  lat: 53.5461,
  lng: -113.4938,
  name: "Edmonton Fleet Hub",
};

/**
 * Calculates straight-line distance in kilometers between two coordinates (Haversine formula).
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fallback estimation when Google API key is missing or call fails.
 */
export function estimateDriveTime(
  destLat: number,
  destLng: number,
  originLat = EDMONTON_DEPOT.lat,
  originLng = EDMONTON_DEPOT.lng
) {
  const km = haversineDistance(originLat, originLng, destLat, destLng);
  // Assume average urban speed of 40 km/h + 5 min routing buffer
  const drivingKm = Math.round(km * 1.3 * 10) / 10;
  const minutes = Math.max(5, Math.round((drivingKm / 40) * 60 + 5));

  return {
    distanceKm: drivingKm,
    durationMinutes: minutes,
    formattedDuration: `~${minutes} min drive`,
    formattedDistance: `${drivingKm} km`,
    isEstimate: true,
  };
}

/**
 * Geocodes an address or postal code string using Google Geocoding API.
 */
export const geocodeAddress = action({
  args: { address: v.string() },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      // Return synthetic Edmonton coordinate estimation based on address/FSA
      const fsa = args.address.toUpperCase().replace(/\s/g, "").slice(0, 3);
      const synthLat = 53.54 + ((fsa.charCodeAt(2) || 65) % 10) * 0.015;
      const synthLng = -113.49 - ((fsa.charCodeAt(1) || 53) % 10) * 0.015;

      const fallbackEst = estimateDriveTime(synthLat, synthLng);
      return {
        lat: synthLat,
        lng: synthLng,
        formattedAddress: `${args.address}, Edmonton, AB, Canada`,
        postalCode: fsa,
        fsa,
        driveTime: fallbackEst,
        isFallback: true,
      };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        args.address
      )}&key=${apiKey}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "OK" || !data.results?.[0]) {
        throw new Error(`Geocoding failed with status: ${data.status}`);
      }

      const result = data.results[0];
      const loc = result.geometry.location;

      // Extract postal code from address components if present
      let postalCode = "";
      for (const comp of result.address_components) {
        if (comp.types.includes("postal_code")) {
          postalCode = comp.short_name;
          break;
        }
      }
      const fsa = postalCode.replace(/\s/g, "").slice(0, 3);

      const driveTime = estimateDriveTime(loc.lat, loc.lng);

      return {
        lat: loc.lat,
        lng: loc.lng,
        formattedAddress: result.formatted_address,
        postalCode,
        fsa,
        driveTime,
        isFallback: false,
      };
    } catch (err: any) {
      // Fallback on network/API failure
      const synthLat = 53.5461;
      const synthLng = -113.4938;
      return {
        lat: synthLat,
        lng: synthLng,
        formattedAddress: `${args.address}, Edmonton, AB`,
        postalCode: "",
        fsa: args.address.slice(0, 3).toUpperCase(),
        driveTime: estimateDriveTime(synthLat, synthLng),
        isFallback: true,
        error: err?.message || "Geocoding API error",
      };
    }
  },
});

/**
 * Calculates drive time between origin and destination using Google Routes API / Distance Matrix.
 */
export const calculateDriveTime = action({
  args: {
    originLat: v.number(),
    originLng: v.number(),
    destLat: v.number(),
    destLng: v.number(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return estimateDriveTime(
        args.destLat,
        args.destLng,
        args.originLat,
        args.originLng
      );
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${args.originLat},${args.originLng}&destinations=${args.destLat},${args.destLng}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (
        data.status === "OK" &&
        data.rows?.[0]?.elements?.[0]?.status === "OK"
      ) {
        const element = data.rows[0].elements[0];
        const km = Math.round((element.distance.value / 1000) * 10) / 10;
        const minutes = Math.round(element.duration.value / 60);

        return {
          distanceKm: km,
          durationMinutes: minutes,
          formattedDuration: element.duration.text || `${minutes} mins`,
          formattedDistance: element.distance.text || `${km} km`,
          isEstimate: false,
        };
      }

      return estimateDriveTime(
        args.destLat,
        args.destLng,
        args.originLat,
        args.originLng
      );
    } catch {
      return estimateDriveTime(
        args.destLat,
        args.destLng,
        args.originLat,
        args.originLng
      );
    }
  },
});
