import {
  scoreDistance,
  scoreCurrentAvailability,
  scorePredictedAvailability,
  scorePrice,
  generateRecommendationReasons,
  scoreParkingLocation,
  getSmartRecommendations,
} from '../src/utils/recommendationEngine.js';

console.log('====================================================');
console.log(' SMART PARKING RECOMMENDATION ENGINE - TEST SUITE');
console.log('====================================================');

// Test 1: Distance Scoring
console.log('\n[TEST 1] Distance Scoring:');
console.log(' 0.5 km score:', scoreDistance(0.5), '(expected >= 95)');
console.log(' 2.0 km score:', scoreDistance(2.0), '(expected ~75)');
console.log(' 12 km score:', scoreDistance(12), '(expected <= 20)');
if (scoreDistance(0.5) < scoreDistance(2.0)) throw new Error('Distance score inverted');

// Test 2: Availability Scoring
console.log('\n[TEST 2] Availability Scoring:');
console.log(' 0 slots score:', scoreCurrentAvailability(0, 50), '(expected 0)');
console.log(' 10 slots / 50 score:', scoreCurrentAvailability(10, 50));
console.log(' 40 slots / 50 score:', scoreCurrentAvailability(40, 50));
if (scoreCurrentAvailability(0, 50) !== 0) throw new Error('Zero availability must yield 0 score');

// Test 3: Multiple Parking Locations Comparison
console.log('\n[TEST 3] Comparing Multiple Locations:');
const sampleParkings = [
  {
    id: 'p1',
    name: 'Central Metro Tech Park Parking',
    distance: '0.8 km',
    _distKm: 0.8,
    availableSlots: 18,
    totalSlots: 60,
    pricePerHour: 40,
    status: 'Active',
  },
  {
    id: 'p2',
    name: 'Grand Mall Underground Plaza',
    distance: '1.4 km',
    _distKm: 1.4,
    availableSlots: 2, // Near full
    totalSlots: 80,
    pricePerHour: 55,
    status: 'Active',
  },
  {
    id: 'p3',
    name: 'University Station Smart Garage',
    distance: '3.2 km',
    _distKm: 3.2,
    availableSlots: 32, // Plenty of slots, but further away
    totalSlots: 50,
    pricePerHour: 30, // Cheap
    status: 'Active',
  },
  {
    id: 'p4',
    name: 'Faraway Industrial Parking',
    distance: '14.5 km', // Too far
    _distKm: 14.5,
    availableSlots: 40,
    totalSlots: 50,
    pricePerHour: 20,
    status: 'Active',
  },
];

const mockAiMap = {
  p1: {
    predictions: {
      '30_min': { predicted_available_slots: 16, trend: 'Stable' },
    },
  },
  p2: {
    predictions: {
      '30_min': { predicted_available_slots: 0, trend: 'Increasing' }, // Will be totally full
    },
  },
  p3: {
    predictions: {
      '30_min': { predicted_available_slots: 30, trend: 'Stable' },
    },
  },
};

const result = getSmartRecommendations(sampleParkings, mockAiMap);
console.log('Top Recommended:', result.recommended.parking.name);
console.log('Composite Score:', result.recommended.compositeScore);
console.log('Reasons:');
result.recommended.reasons.forEach((r) => console.log(`  - [${r.title}]: ${r.detail}`));

// Verify P1 beats P2 because P2 is almost full and expensive
if (result.recommended.parking.id === 'p2') {
  throw new Error('Grand Mall should not be recommended when it has only 2 slots and is almost full!');
}

// Test 4: Filter testing (simulate user filtering out p1 by max price <= 35)
console.log('\n[TEST 4] Recommendation Under Price Filter (maxPrice = 30):');
const filteredUnder35 = sampleParkings.filter((p) => p.pricePerHour <= 35);
const resultFiltered = getSmartRecommendations(filteredUnder35, mockAiMap);
console.log('Top Under ₹35:', resultFiltered.recommended.parking.name, '(Price: ₹' + resultFiltered.recommended.parking.pricePerHour + ')');
if (resultFiltered.recommended.parking.id !== 'p3') {
  throw new Error('University Station should win under ₹35 filter');
}

console.log('\n====================================================');
console.log(' ALL 4 RECOMMENDATION TESTS PASSED CLEANLY!');
console.log('====================================================');
