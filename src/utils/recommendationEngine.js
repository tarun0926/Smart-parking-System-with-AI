/**
 * SmartPark AI - Modular Recommendation Engine
 * Evaluates and ranks parking locations using 4 key factors:
 * 1. Distance (km)
 * 2. Current Availability (slots & ratio)
 * 3. Predicted Availability (AI multi-horizon forecast)
 * 4. Price/hour (₹)
 * 
 * Generates transparent, explainable reasons for recommendations.
 */

export const DEFAULT_WEIGHTS = {
  currentAvailability: 0.35,
  predictedAvailability: 0.25,
  distance: 0.25,
  price: 0.15,
};

/**
 * Score Distance (0 - 100): Closer is better
 */
export function scoreDistance(distanceKm) {
  const d = Math.max(0, parseFloat(distanceKm) || 1.0);
  if (d <= 0.5) return 100;
  if (d <= 2.0) return 95 - ((d - 0.5) / 1.5) * 20; // 95 -> 75
  if (d <= 5.0) return 75 - ((d - 2.0) / 3.0) * 35; // 75 -> 40
  if (d <= 10.0) return Math.max(15, 40 - ((d - 5.0) / 5.0) * 25); // 40 -> 15
  return 10;
}

/**
 * Score Current Availability (0 - 100): More slots & higher free ratio is better
 */
export function scoreCurrentAvailability(availableSlots, totalSlots) {
  const avail = Math.max(0, parseInt(availableSlots, 10) || 0);
  const total = Math.max(1, parseInt(totalSlots, 10) || 50);

  // If totally full, heavy penalty
  if (avail === 0) return 0;

  const ratio = Math.min(1.0, avail / total);
  // Blend ratio with raw count confidence (up to 15 slots)
  const countScore = Math.min(1.0, avail / 15.0) * 40;
  const ratioScore = ratio * 60;
  return Math.min(100, Math.round(countScore + ratioScore));
}

/**
 * Score Predicted Availability (0 - 100): High future slots from AI model
 */
export function scorePredictedAvailability(predAvailableSlots, totalSlots, trend = 'Stable') {
  const predAvail = Math.max(0, parseInt(predAvailableSlots, 10) || 0);
  const total = Math.max(1, parseInt(totalSlots, 10) || 50);

  if (predAvail === 0) return 5;

  const ratio = Math.min(1.0, predAvail / total);
  let score = ratio * 80 + Math.min(predAvail, 10) * 2;

  // Trend adjustments
  if (trend === 'Decreasing' || trend === 'Increasing Availability') score += 5;
  if (trend === 'Increasing' || trend === 'Filling Up') score -= 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Score Price (0 - 100): Lower hourly cost is better
 */
export function scorePrice(pricePerHour) {
  const p = Math.max(10, parseFloat(pricePerHour) || 40);
  if (p <= 25) return 100;
  if (p <= 40) return 95 - ((p - 25) / 15) * 25; // 95 -> 70
  if (p <= 60) return 70 - ((p - 40) / 20) * 35; // 70 -> 35
  if (p <= 100) return Math.max(15, 35 - ((p - 60) / 40) * 20);
  return 10;
}

/**
 * Generate transparent, human-readable explanations based on factor performance
 */
export function generateRecommendationReasons({
  distanceKm,
  availableSlots,
  totalSlots,
  predAvailableSlots,
  pricePerHour,
  scores,
}) {
  const reasons = [];

  // 1. Current Availability Reason
  if (scores.currentAvailability >= 60 || availableSlots >= 6) {
    reasons.push({
      category: 'Current Availability',
      title: 'Good current availability',
      detail: `${availableSlots} of ${totalSlots} bays currently open for immediate parking`,
      positive: true,
      icon: 'check',
    });
  } else if (availableSlots > 0) {
    reasons.push({
      category: 'Current Availability',
      title: 'Adequate current availability',
      detail: `${availableSlots} bays remaining right now`,
      positive: true,
      icon: 'info',
    });
  } else {
    reasons.push({
      category: 'Current Availability',
      title: 'Limited slots right now',
      detail: 'Facility is currently near full capacity',
      positive: false,
      icon: 'alert',
    });
  }

  // 2. Predicted Availability Reason
  if (scores.predictedAvailability >= 55 || predAvailableSlots >= 5) {
    reasons.push({
      category: 'Predicted Availability',
      title: 'Good predicted availability',
      detail: `AI forecasts ${predAvailableSlots} available bays over the next 30-60 minutes`,
      positive: true,
      icon: 'check',
    });
  } else {
    reasons.push({
      category: 'Predicted Availability',
      title: 'Moderate predicted availability',
      detail: `AI expects ${predAvailableSlots} slots available as demand fluctuates`,
      positive: true,
      icon: 'info',
    });
  }

  // 3. Distance Reason
  const d = parseFloat(distanceKm) || 1.0;
  if (d <= 1.5) {
    reasons.push({
      category: 'Distance',
      title: 'Reasonable distance',
      detail: `Only ${d.toFixed(1)} km away — quick access from your current location`,
      positive: true,
      icon: 'check',
    });
  } else if (d <= 3.5) {
    reasons.push({
      category: 'Distance',
      title: 'Reasonable distance',
      detail: `${d.toFixed(1)} km away within convenient driving radius`,
      positive: true,
      icon: 'check',
    });
  } else {
    reasons.push({
      category: 'Distance',
      title: 'Accessible distance',
      detail: `${d.toFixed(1)} km from destination`,
      positive: false,
      icon: 'info',
    });
  }

  // 4. Price Reason
  const p = parseFloat(pricePerHour) || 40;
  if (p <= 35) {
    reasons.push({
      category: 'Price',
      title: 'Reasonable price',
      detail: `Affordable ₹${p}/hour rate below city center average`,
      positive: true,
      icon: 'check',
    });
  } else if (p <= 50) {
    reasons.push({
      category: 'Price',
      title: 'Reasonable price',
      detail: `Fair market rate at ₹${p}/hour with premium facilities`,
      positive: true,
      icon: 'check',
    });
  } else {
    reasons.push({
      category: 'Price',
      title: 'Premium pricing',
      detail: `₹${p}/hour for specialized high-amenity parking`,
      positive: false,
      icon: 'info',
    });
  }

  return reasons;
}

/**
 * Score a single parking location
 */
export function scoreParkingLocation(parking, aiPrediction = null, weights = DEFAULT_WEIGHTS) {
  const totalSlots = parking.totalSlots || 50;
  const availableSlots = typeof parking.availableSlots === 'number' ? parking.availableSlots : 10;
  
  // Extract or estimate distance
  const distanceKm = typeof parking._distKm === 'number' 
    ? parking._distKm 
    : parseFloat(parking.distance) || 1.2;
    
  const pricePerHour = parking.pricePerHour || 40;

  // Extract predicted availability from real AI prediction if present
  let predAvailableSlots = availableSlots;
  let predTrend = 'Stable';
  
  if (aiPrediction && aiPrediction.predictions) {
    const p30 = aiPrediction.predictions['30_min'];
    const p60 = aiPrediction.predictions['60_min'];
    predAvailableSlots = p30?.predicted_available_slots ?? p60?.predicted_available_slots ?? availableSlots;
    predTrend = p30?.trend ?? 'Stable';
  } else if (parking.aiPrediction) {
    // If baked into parking document
    const occ1hr = parking.aiPrediction.predictedOccupancy1hr || 70;
    predAvailableSlots = Math.max(1, Math.round(totalSlots * (1 - occ1hr / 100)));
  } else {
    // Conservative realistic estimate when AI prediction not yet loaded
    predAvailableSlots = Math.max(0, Math.round(availableSlots * 0.9));
  }

  // Compute individual factor scores
  const distScore = scoreDistance(distanceKm);
  const currAvailScore = scoreCurrentAvailability(availableSlots, totalSlots);
  const predAvailScore = scorePredictedAvailability(predAvailableSlots, totalSlots, predTrend);
  const priceScore = scorePrice(pricePerHour);

  const scores = {
    distance: distScore,
    currentAvailability: currAvailScore,
    predictedAvailability: predAvailScore,
    price: priceScore,
  };

  // Weighted composite score (0 - 100)
  const compositeScore = Math.round(
    scores.currentAvailability * weights.currentAvailability +
    scores.predictedAvailability * weights.predictedAvailability +
    scores.distance * weights.distance +
    scores.price * weights.price
  );

  const reasons = generateRecommendationReasons({
    distanceKm,
    availableSlots,
    totalSlots,
    predAvailableSlots,
    pricePerHour,
    scores,
  });

  return {
    parking,
    compositeScore,
    scores,
    reasons,
    metrics: {
      distanceKm: typeof distanceKm === 'number' ? Number(distanceKm.toFixed(1)) : distanceKm,
      availableSlots,
      totalSlots,
      predAvailableSlots,
      pricePerHour,
      occupancyPercentage: Math.round(((totalSlots - availableSlots) / totalSlots) * 100),
      predOccupancyPercentage: Math.round(((totalSlots - predAvailableSlots) / totalSlots) * 100),
    },
  };
}

/**
 * Compare multiple parking locations and recommend the most suitable option
 * 
 * @param {Array} parkingList - Array of parking location objects
 * @param {Object} aiPredictionsMap - Optional map of parkingId -> AI prediction result
 * @param {Object} weights - Optional custom factor weights
 * @returns {Object} { recommended: Object, rankedList: Array }
 */
export function getSmartRecommendations(parkingList = [], aiPredictionsMap = {}, weights = DEFAULT_WEIGHTS) {
  if (!Array.isArray(parkingList) || parkingList.length === 0) {
    return { recommended: null, rankedList: [] };
  }

  // Filter out completely closed/maintenance locations if any
  const eligible = parkingList.filter((p) => p.status !== 'Maintenance');
  const pool = eligible.length > 0 ? eligible : parkingList;

  // Score all candidates
  const scored = pool.map((p) => {
    const id = p._id || p.id;
    const aiPred = aiPredictionsMap[id] || null;
    return scoreParkingLocation(p, aiPred, weights);
  });

  // Sort descending by composite score, then by available slots
  scored.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    return b.metrics.availableSlots - a.metrics.availableSlots;
  });

  return {
    recommended: scored[0] || null,
    rankedList: scored,
    totalEvaluated: scored.length,
  };
}
