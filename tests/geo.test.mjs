import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistance, estimateDriveTime, EDMONTON_DEPOT } from '../convex/geo.ts';
import { estimateLocalDriveTime, EDMONTON_HUB } from '../src/lib/geo.ts';

test('Haversine distance calculation in Edmonton', () => {
  // Distance from Edmonton City Centre to West Edmonton Mall (~53.5225, -113.6242)
  const dist = haversineDistance(53.5461, -113.4938, 53.5225, -113.6242);
  assert.ok(dist > 7 && dist < 12, `Distance should be ~9 km, got ${dist}`);
});

test('estimateDriveTime returns structured drive estimate', () => {
  const est = estimateDriveTime(53.5225, -113.6242, EDMONTON_DEPOT.lat, EDMONTON_DEPOT.lng);
  assert.equal(est.isEstimate, true);
  assert.ok(est.durationMinutes >= 10, 'Drive time should be at least 10 min');
  assert.ok(est.formattedDuration.includes('min drive'));
});

test('estimateLocalDriveTime client helper consistency', () => {
  const clientEst = estimateLocalDriveTime(53.5225, -113.6242);
  assert.equal(clientEst.isEstimate, true);
  assert.ok(clientEst.distanceKm > 5);
});
