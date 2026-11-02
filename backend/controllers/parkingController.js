import mongoose from 'mongoose';
import axios from 'axios';
import Parking from '../models/Parking.js';
import ParkingSlot from '../models/ParkingSlot.js';

let defaultParkingLocations = [
  {
    id: "p1",
    name: "Central Metro Tech Park Parking",
    address: "102 Tech Boulevard, City Center, Sector 4",
    distance: "0.8 km",
    pricePerHour: 40,
    availableSlots: 18,
    totalSlots: 60,
    status: "Active",
    rating: 4.8,
    type: "Multi-level Covered",
    facilities: ["EV Fast Charging", "24/7 Security & CCTV", "Covered Bay", "Disabled Access"],
    coordinates: { lat: 12.9716, lng: 77.5946 },
    slots: Array.from({ length: 12 }, (_, i) => ({
      id: `S-${i + 1}`,
      number: `A-${101 + i}`,
      floor: i < 6 ? "Level 1" : "Level 2",
      type: i % 4 === 0 ? "EV Charging" : "Standard",
      status: i < 8 ? "available" : "occupied",
      price: 40,
    })),
    aiPrediction: {
      currentOccupancy: 70,
      predictedOccupancy1hr: 85,
      predictedOccupancy2hr: 92,
      peakHours: "09:00 AM - 11:30 AM & 05:00 PM - 07:30 PM",
      recommendation: "High demand expected in 1 hour. Reserve now to guarantee your spot.",
    },
  },
  {
    id: "p2",
    name: "Grand Mall Underground Plaza",
    address: "45 Commercial Avenue, Downtown West",
    distance: "1.4 km",
    pricePerHour: 50,
    availableSlots: 6,
    totalSlots: 80,
    status: "Active",
    rating: 4.6,
    type: "Underground Basement",
    facilities: ["Valet Assistance", "CCTV Surveillance", "Automated Boom Barrier"],
    coordinates: { lat: 12.9789, lng: 77.5912 },
    slots: Array.from({ length: 12 }, (_, i) => ({
      id: `B-${i + 1}`,
      number: `B-${201 + i}`,
      floor: "Basement 1",
      type: "Standard",
      status: i < 6 ? "available" : "occupied",
      price: 50,
    })),
    aiPrediction: {
      currentOccupancy: 92,
      predictedOccupancy1hr: 98,
      predictedOccupancy2hr: 100,
      peakHours: "01:00 PM - 04:00 PM",
      recommendation: "Parking almost full. Consider Central Metro Tech Park as alternative.",
    },
  },
  {
    id: "p3",
    name: "University Station Smart Garage",
    address: "12 College Road, Near North Gate",
    distance: "2.1 km",
    pricePerHour: 30,
    availableSlots: 32,
    totalSlots: 50,
    status: "Active",
    rating: 4.9,
    type: "Surface Open Parking",
    facilities: ["24/7 Access", "EV Fast Charging", "Mobile Payment"],
    coordinates: { lat: 12.9654, lng: 77.6011 },
    slots: Array.from({ length: 12 }, (_, i) => ({
      id: `U-${i + 1}`,
      number: `C-${301 + i}`,
      floor: "Ground",
      type: "Standard",
      status: i < 9 ? "available" : "occupied",
      price: 30,
    })),
    aiPrediction: {
      currentOccupancy: 36,
      predictedOccupancy1hr: 45,
      predictedOccupancy2hr: 50,
      peakHours: "08:30 AM - 10:30 AM",
      recommendation: "Plenty of slots available. Fast check-in estimated.",
    },
  },
];

// @desc    Get all parking locations
// @route   GET /api/parking
// @access  Public
export const getAllParking = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const { search } = req.query;
      let query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
        ];
      }

      const parkings = await Parking.find(query).lean();

      if (parkings.length > 0) {
        const parkingsWithSlots = await Promise.all(
          parkings.map(async (p) => {
            const slots = await ParkingSlot.find({ parking: p._id }).lean();
            return {
              ...p,
              id: p._id,
              slots: slots.map((s) => ({ ...s, id: s._id, number: s.slotNumber })),
            };
          })
        );

        return res.json({
          success: true,
          count: parkingsWithSlots.length,
          data: parkingsWithSlots,
        });
      }
    }

    // Fallback data
    const search = req.query.search?.toLowerCase() || '';
    const filtered = defaultParkingLocations.filter(
      (p) => p.name.toLowerCase().includes(search) || p.address.toLowerCase().includes(search)
    );

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error('[Get All Parking Error]:', error);
    res.status(500).json({ message: error.message || 'Error fetching parking locations' });
  }
};

// @desc    Get single parking location by ID
// @route   GET /api/parking/:id
// @access  Public
export const getParkingById = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      const parking = await Parking.findById(req.params.id).lean();
      if (parking) {
        const slots = await ParkingSlot.find({ parking: parking._id }).lean();
        return res.json({
          success: true,
          data: {
            ...parking,
            id: parking._id,
            slots: slots.map((s) => ({ ...s, id: s._id, number: s.slotNumber })),
          },
        });
      }
    }

    // Fallback search
    const parking = defaultParkingLocations.find((p) => p.id === req.params.id) || defaultParkingLocations[0];
    res.json({
      success: true,
      data: parking,
    });
  } catch (error) {
    console.error('[Get Parking By ID Error]:', error);
    res.status(500).json({ message: 'Error fetching parking location details' });
  }
};

// @desc    Get slots for a specific parking location
// @route   GET /api/parking/:id/slots
// @access  Public
export const getParkingSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      const slots = await ParkingSlot.find({ parking: id }).lean();
      if (slots.length > 0) {
        return res.json({
          success: true,
          count: slots.length,
          data: slots.map((s) => ({ ...s, id: s._id, number: s.slotNumber })),
        });
      }
    }

    // Fallback data if DB disconnected or mock ID passed
    const parking = defaultParkingLocations.find((p) => p.id === id) || defaultParkingLocations[0];
    return res.json({
      success: true,
      count: parking.slots.length,
      data: parking.slots,
    });
  } catch (error) {
    console.error('[Get Parking Slots Error]:', error);
    res.status(500).json({ message: 'Error fetching parking slots' });
  }
};

// ─── Haversine helper (returns km) ─────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// @desc    Get parking locations near a GPS coordinate
// @route   GET /api/parking/nearby?lat=&lng=&maxKm=
// @access  Public
export const getNearbyParking = async (req, res) => {
  try {
    const { lat, lng, maxKm = 10 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng query params are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radius = parseFloat(maxKm);
    const isConnected = mongoose.connection.readyState === 1;

    let allParkings = [];

    if (isConnected) {
      allParkings = await Parking.find({}).lean();
    }

    if (!allParkings.length) {
      allParkings = defaultParkingLocations;
    }

    const nearby = allParkings
      .map((p) => {
        const dist = haversineKm(
          userLat, userLng,
          p.coordinates?.lat ?? 0,
          p.coordinates?.lng ?? 0
        );
        return { ...p, id: p._id || p.id, _distKm: dist, distance: `${dist.toFixed(1)} km` };
      })
      .filter((p) => p._distKm <= radius)
      .sort((a, b) => a._distKm - b._distKm);

    res.json({ success: true, count: nearby.length, data: nearby });
  } catch (error) {
    console.error('[Get Nearby Parking Error]:', error);
    res.status(500).json({ message: 'Error fetching nearby parking' });
  }
};

// @desc    Compare multiple parking locations and recommend the most suitable option
// @route   GET /api/parking/recommend?lat=&lng=
// @access  Public
export const getRecommendedParking = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const isConnected = mongoose.connection.readyState === 1;

    let parkings = [];
    if (isConnected) {
      parkings = await Parking.find({ status: { $ne: 'Maintenance' } }).lean();
    }
    if (!parkings || parkings.length === 0) {
      parkings = defaultParkingLocations;
    }

    const userLat = lat ? parseFloat(lat) : 12.9716;
    const userLng = lng ? parseFloat(lng) : 77.5946;

    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

    // Enrich each parking location with distance, actual slots and AI prediction
    const enriched = await Promise.all(
      parkings.map(async (p) => {
        let totalSlots = p.totalSlots || 50;
        let availableSlots = p.availableSlots || 15;
        let occupiedSlots = Math.max(0, totalSlots - availableSlots);

        if (isConnected && mongoose.Types.ObjectId.isValid(p._id)) {
          const totalSlotDocs = await ParkingSlot.countDocuments({ parking: p._id });
          const occDocs = await ParkingSlot.countDocuments({
            parking: p._id,
            status: { $in: ['occupied', 'reserved'] },
          });
          if (totalSlotDocs > 0) {
            totalSlots = totalSlotDocs;
            occupiedSlots = occDocs;
            availableSlots = Math.max(0, totalSlots - occupiedSlots);
          }
        }

        const distKm = haversineKm(
          userLat,
          userLng,
          p.coordinates?.lat ?? 12.9716,
          p.coordinates?.lng ?? 77.5946
        );

        // Fetch AI prediction for this parking location
        let predAvailableSlots = Math.max(0, Math.round(availableSlots * 0.9));
        let aiDetails = null;

        try {
          const aiRes = await axios.post(
            `${aiServiceUrl}/predict`,
            {
              parking_id: String(p._id || p.id),
              hour: currentHour,
              day_of_week: dayOfWeek,
              total_slots: totalSlots,
              current_occupied: occupiedSlots,
            },
            { timeout: 3000 }
          );

          if (aiRes.data && aiRes.data.predictions) {
            aiDetails = aiRes.data;
            predAvailableSlots =
              aiRes.data.predictions['30_min']?.predicted_available_slots ?? availableSlots;
          }
        } catch (err) {
          // Graceful fallback if AI prediction times out
        }

        const pricePerHour = p.pricePerHour || 40;

        // Modular factor scores (0 - 100)
        // 1. Distance score
        let scoreDist = 10;
        if (distKm <= 0.5) scoreDist = 100;
        else if (distKm <= 2.0) scoreDist = 95 - ((distKm - 0.5) / 1.5) * 20;
        else if (distKm <= 5.0) scoreDist = 75 - ((distKm - 2.0) / 3.0) * 35;
        else if (distKm <= 10.0) scoreDist = Math.max(15, 40 - ((distKm - 5.0) / 5.0) * 25);

        // 2. Current availability score
        const currRatio = availableSlots / Math.max(totalSlots, 1);
        const scoreCurr =
          availableSlots === 0
            ? 0
            : Math.min(100, Math.round(currRatio * 60 + Math.min(availableSlots, 15) * 2.67));

        // 3. Predicted availability score
        const predRatio = predAvailableSlots / Math.max(totalSlots, 1);
        const scorePred =
          predAvailableSlots === 0
            ? 5
            : Math.min(100, Math.round(predRatio * 75 + Math.min(predAvailableSlots, 10) * 2.5));

        // 4. Price score
        let scorePrice = 10;
        if (pricePerHour <= 25) scorePrice = 100;
        else if (pricePerHour <= 40) scorePrice = 95 - ((pricePerHour - 25) / 15) * 25;
        else if (pricePerHour <= 60) scorePrice = 70 - ((pricePerHour - 40) / 20) * 35;
        else scorePrice = Math.max(15, 35 - ((pricePerHour - 60) / 40) * 20);

        // Composite score
        const compositeScore = Math.round(
          scoreCurr * 0.35 +
          scorePred * 0.25 +
          scoreDist * 0.25 +
          scorePrice * 0.15
        );

        // Transparent Reasons
        const reasons = [];
        if (scoreCurr >= 55 || availableSlots >= 6) {
          reasons.push({
            category: 'Current Availability',
            title: 'Good current availability',
            detail: `${availableSlots} of ${totalSlots} bays open for immediate parking`,
            positive: true,
          });
        } else if (availableSlots > 0) {
          reasons.push({
            category: 'Current Availability',
            title: 'Adequate current availability',
            detail: `${availableSlots} bays remaining right now`,
            positive: true,
          });
        }

        if (scorePred >= 55 || predAvailableSlots >= 5) {
          reasons.push({
            category: 'Predicted Availability',
            title: 'Good predicted availability',
            detail: `AI forecasts ${predAvailableSlots} available slots in next 30-60 mins`,
            positive: true,
          });
        } else {
          reasons.push({
            category: 'Predicted Availability',
            title: 'Moderate predicted availability',
            detail: `AI expects ${predAvailableSlots} slots available`,
            positive: true,
          });
        }

        if (distKm <= 3.5) {
          reasons.push({
            category: 'Distance',
            title: 'Reasonable distance',
            detail: `${distKm.toFixed(1)} km away within convenient radius`,
            positive: true,
          });
        } else {
          reasons.push({
            category: 'Distance',
            title: 'Accessible distance',
            detail: `${distKm.toFixed(1)} km from destination`,
            positive: true,
          });
        }

        if (pricePerHour <= 50) {
          reasons.push({
            category: 'Price',
            title: 'Reasonable price',
            detail: `Fair rate at ₹${pricePerHour}/hour`,
            positive: true,
          });
        }

        return {
          id: p._id || p.id,
          name: p.name,
          address: p.address,
          distance: `${distKm.toFixed(1)} km`,
          distanceKm: Number(distKm.toFixed(1)),
          pricePerHour,
          availableSlots,
          totalSlots,
          predictedAvailableSlots: predAvailableSlots,
          compositeScore,
          scores: {
            distance: Math.round(scoreDist),
            currentAvailability: scoreCurr,
            predictedAvailability: scorePred,
            price: Math.round(scorePrice),
          },
          reasons,
          aiPrediction: aiDetails,
        };
      })
    );

    // Rank descending
    enriched.sort((a, b) => b.compositeScore - a.compositeScore);

    return res.json({
      success: true,
      recommended: enriched[0] || null,
      alternatives: enriched.slice(1),
      count: enriched.length,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Get Recommended Parking Error]:', error);
    res.status(500).json({ success: false, message: 'Error calculating parking recommendations' });
  }
};

// @desc    Get AI availability and occupancy prediction for a parking location
// @route   GET /api/parking/:id/prediction
// @access  Public
export const getParkingPrediction = async (req, res) => {
  try {
    const { id } = req.params;
    const isConnected = mongoose.connection.readyState === 1;

    let parking = null;
    let totalSlots = 50;
    let currentOccupied = 20;

    // 1. Fetch parking data from MongoDB
    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      parking = await Parking.findById(id).lean();
      if (parking) {
        totalSlots = parking.totalSlots || 50;

        // 2. Get current occupancy from ParkingSlot count
        const occupiedCount = await ParkingSlot.countDocuments({
          parking: parking._id,
          status: { $in: ['occupied', 'reserved'] }
        });

        const totalSlotDocs = await ParkingSlot.countDocuments({ parking: parking._id });

        if (totalSlotDocs > 0) {
          totalSlots = totalSlotDocs;
          currentOccupied = occupiedCount;
        } else if (typeof parking.availableSlots === 'number') {
          currentOccupied = Math.max(0, totalSlots - parking.availableSlots);
        }
      }
    }

    // Fallback to in-memory/demo locations if MongoDB record not found or not connected
    if (!parking) {
      parking = defaultParkingLocations.find((p) => p.id === id) || defaultParkingLocations[0];
      totalSlots = parking.totalSlots || 60;
      currentOccupied = Math.max(0, totalSlots - (parking.availableSlots ?? 20));
    }

    // 3. Determine current hour and day
    const now = new Date();
    const currentHour = now.getHours();
    // Python model expects day_of_week: 0=Monday, 6=Sunday
    const dayOfWeek = (now.getDay() + 6) % 7;

    // Feature payload for FastAPI
    const aiPayload = {
      parking_id: String(parking._id || parking.id || 'PARK_001'),
      hour: currentHour,
      day_of_week: dayOfWeek,
      total_slots: totalSlots,
      current_occupied: currentOccupied
    };

    // 4. Send features to FastAPI
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

    try {
      const response = await axios.post(`${aiServiceUrl}/predict`, aiPayload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });

      // 5. Receive prediction & 6. Return prediction to React
      return res.json({
        success: true,
        source: 'fastapi_ml_service',
        isAiServiceAvailable: true,
        parking: {
          id: parking._id || parking.id,
          name: parking.name,
          address: parking.address,
          totalSlots,
          currentOccupied,
          currentAvailable: Math.max(0, totalSlots - currentOccupied),
          occupancyRate: Number(((currentOccupied / totalSlots) * 100).toFixed(1))
        },
        data: response.data
      });
    } catch (aiError) {
      console.warn(`[AI Service Unavailable]: Could not connect to FastAPI at ${aiServiceUrl}/predict (${aiError.message})`);
      
      // Handle AI service unavailable gracefully
      return res.status(503).json({
        success: false,
        isAiServiceAvailable: false,
        error: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI Prediction Service (FastAPI) is currently offline or unreachable at port 8000.',
        parking: {
          id: parking._id || parking.id,
          name: parking.name,
          totalSlots,
          currentOccupied,
          currentAvailable: Math.max(0, totalSlots - currentOccupied)
        }
      });
    }
  } catch (error) {
    console.error('[Get Parking Prediction Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error processing AI prediction' });
  }
};

// @desc    Create a new parking location (Owner / Admin feature)
// @route   POST /api/parking
// @access  Private
export const createParking = async (req, res) => {
  try {
    const { name, address, pricePerHour, totalSlots = 20, facilities = [], type = 'Multi-level Covered', city = 'City Center', coordinates } = req.body;

    if (!name || !address || !pricePerHour) {
      return res.status(400).json({ message: 'Please provide name, address and pricePerHour' });
    }

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      const newParking = await Parking.create({
        name,
        address,
        city,
        pricePerHour: Number(pricePerHour),
        totalSlots: Number(totalSlots),
        availableSlots: Number(totalSlots),
        facilities: Array.isArray(facilities) ? facilities : facilities.split(',').map(s => s.trim()),
        type,
        status: 'Active',
        rating: 4.8,
        distance: '1.2 km',
        coordinates: coordinates || { lat: 12.9716, lng: 77.5946 },
        owner: req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id) ? req.user._id : undefined,
      });

      // Generate default slots
      const slotCount = Math.min(Number(totalSlots), 24);
      const slotDocs = Array.from({ length: slotCount }, (_, i) => ({
        parking: newParking._id,
        slotNumber: `${String.fromCharCode(65 + Math.floor(i / 8))}-${101 + (i % 8)}`,
        floor: `Level ${Math.floor(i / 8) + 1}`,
        type: i % 4 === 0 ? 'EV Charging' : 'Standard',
        status: 'available',
        price: Number(pricePerHour),
      }));

      await ParkingSlot.insertMany(slotDocs);

      return res.status(201).json({
        success: true,
        message: 'Parking location created successfully',
        data: {
          ...newParking.toObject(),
          id: newParking._id,
          slots: slotDocs.map((s, idx) => ({ ...s, id: `slot-${idx + 1}` })),
        },
      });
    }

    // In-memory fallback
    const id = `p-${Date.now()}`;
    const slots = Array.from({ length: Number(totalSlots) || 12 }, (_, i) => ({
      id: `S-${id}-${i + 1}`,
      number: `${String.fromCharCode(65 + Math.floor(i / 8))}-${101 + (i % 8)}`,
      floor: `Level ${Math.floor(i / 8) + 1}`,
      type: i % 4 === 0 ? 'EV Charging' : 'Standard',
      status: 'available',
      price: Number(pricePerHour),
    }));

    const mockParking = {
      id,
      _id: id,
      name,
      address,
      city,
      distance: '1.2 km',
      pricePerHour: Number(pricePerHour),
      availableSlots: Number(totalSlots),
      totalSlots: Number(totalSlots),
      status: 'Active',
      rating: 4.9,
      type,
      facilities: Array.isArray(facilities) ? facilities : facilities.split(',').map(s => s.trim()),
      coordinates: coordinates || { lat: 12.9716, lng: 77.5946 },
      slots,
      owner: req.user?._id || 'owner-1',
    };

    defaultParkingLocations.unshift(mockParking);

    return res.status(201).json({
      success: true,
      message: 'Parking location created successfully (In-memory mode)',
      data: mockParking,
    });
  } catch (error) {
    console.error('[Create Parking Error]:', error);
    res.status(500).json({ message: error.message || 'Error creating parking facility' });
  }
};

// @desc    Update existing parking location (Owner / Admin feature)
// @route   PUT /api/parking/:id
// @access  Private
export const updateParking = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, pricePerHour, status, facilities, type } = req.body;
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      const parking = await Parking.findById(id);
      if (!parking) return res.status(404).json({ message: 'Parking location not found' });

      if (name) parking.name = name;
      if (address) parking.address = address;
      if (pricePerHour !== undefined) parking.pricePerHour = Number(pricePerHour);
      if (status) parking.status = status;
      if (type) parking.type = type;
      if (facilities) {
        parking.facilities = Array.isArray(facilities) ? facilities : facilities.split(',').map(s => s.trim());
      }

      await parking.save();

      return res.json({
        success: true,
        message: 'Parking facility updated successfully',
        data: { ...parking.toObject(), id: parking._id },
      });
    }

    // In-memory fallback
    const targetIdx = defaultParkingLocations.findIndex(p => p.id === id || p._id === id);
    if (targetIdx !== -1) {
      if (name) defaultParkingLocations[targetIdx].name = name;
      if (address) defaultParkingLocations[targetIdx].address = address;
      if (pricePerHour !== undefined) defaultParkingLocations[targetIdx].pricePerHour = Number(pricePerHour);
      if (status) defaultParkingLocations[targetIdx].status = status;
      if (type) defaultParkingLocations[targetIdx].type = type;
      if (facilities) {
        defaultParkingLocations[targetIdx].facilities = Array.isArray(facilities)
          ? facilities
          : facilities.split(',').map(s => s.trim());
      }
      return res.json({
        success: true,
        message: 'Parking facility updated successfully',
        data: defaultParkingLocations[targetIdx],
      });
    }

    return res.status(404).json({ message: 'Parking location not found' });
  } catch (error) {
    console.error('[Update Parking Error]:', error);
    res.status(500).json({ message: 'Error updating parking facility' });
  }
};

// @desc    Delete parking facility (Owner / Admin feature)
// @route   DELETE /api/parking/:id
// @access  Private
export const deleteParking = async (req, res) => {
  try {
    const { id } = req.params;
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      const parking = await Parking.findByIdAndDelete(id);
      if (!parking) return res.status(404).json({ message: 'Parking location not found' });
      await ParkingSlot.deleteMany({ parking: id });

      return res.json({
        success: true,
        message: 'Parking facility and associated slots removed',
        data: { id },
      });
    }

    const initLen = defaultParkingLocations.length;
    defaultParkingLocations = defaultParkingLocations.filter(p => p.id !== id && p._id !== id);
    if (defaultParkingLocations.length < initLen) {
      return res.json({
        success: true,
        message: 'Parking facility removed successfully',
        data: { id },
      });
    }

    return res.status(404).json({ message: 'Parking facility not found' });
  } catch (error) {
    console.error('[Delete Parking Error]:', error);
    res.status(500).json({ message: 'Error deleting parking facility' });
  }
};

// @desc    Toggle or set single slot status (Owner feature)
// @route   PUT /api/parking/:id/slots/:slotId
// @access  Private
export const updateSlotStatus = async (req, res) => {
  try {
    const { id, slotId } = req.params;
    const { status } = req.body;
    const isConnected = mongoose.connection.readyState === 1;

    if (!['available', 'occupied', 'maintenance', 'reserved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid slot status' });
    }

    if (isConnected && mongoose.Types.ObjectId.isValid(slotId)) {
      const slot = await ParkingSlot.findById(slotId);
      if (!slot) return res.status(404).json({ message: 'Slot not found' });

      slot.status = status;
      await slot.save();

      // Recalculate available slots count
      const availableCount = await ParkingSlot.countDocuments({ parking: id, status: 'available' });
      await Parking.findByIdAndUpdate(id, { availableSlots: availableCount });

      return res.json({
        success: true,
        message: `Slot ${slot.slotNumber} status updated to ${status}`,
        data: { ...slot.toObject(), id: slot._id, number: slot.slotNumber },
      });
    }

    // In-memory fallback
    const parking = defaultParkingLocations.find(p => p.id === id || p._id === id);
    if (parking && parking.slots) {
      const slot = parking.slots.find(s => s.id === slotId || s._id === slotId || s.number === slotId);
      if (slot) {
        slot.status = status;
        parking.availableSlots = parking.slots.filter(s => s.status === 'available').length;
        return res.json({
          success: true,
          message: `Slot ${slot.number} status updated to ${status}`,
          data: slot,
        });
      }
    }

    return res.status(404).json({ message: 'Slot or parking facility not found' });
  } catch (error) {
    console.error('[Update Slot Status Error]:', error);
    res.status(500).json({ message: 'Error updating slot status' });
  }
};

// @desc    Add a slot to a parking facility (Owner feature)
// @route   POST /api/parking/:id/slots
// @access  Private
export const addSlotToParking = async (req, res) => {
  try {
    const { id } = req.params;
    const { slotNumber, floor = 'Level 1', type = 'Standard', price = 40 } = req.body;

    if (!slotNumber) return res.status(400).json({ message: 'Slot number is required' });

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      const parking = await Parking.findById(id);
      if (!parking) return res.status(404).json({ message: 'Parking facility not found' });

      const newSlot = await ParkingSlot.create({
        parking: id,
        slotNumber,
        floor,
        type,
        status: 'available',
        price: Number(price),
      });

      const totalCount = await ParkingSlot.countDocuments({ parking: id });
      const availCount = await ParkingSlot.countDocuments({ parking: id, status: 'available' });
      await Parking.findByIdAndUpdate(id, { totalSlots: totalCount, availableSlots: availCount });

      return res.status(201).json({
        success: true,
        message: `Slot ${slotNumber} added successfully`,
        data: { ...newSlot.toObject(), id: newSlot._id, number: newSlot.slotNumber },
      });
    }

    // In-memory fallback
    const parking = defaultParkingLocations.find(p => p.id === id || p._id === id);
    if (parking) {
      const newSlot = {
        id: `S-${id}-${Date.now()}`,
        number: slotNumber,
        floor,
        type,
        status: 'available',
        price: Number(price),
      };
      parking.slots = parking.slots || [];
      parking.slots.push(newSlot);
      parking.totalSlots = parking.slots.length;
      parking.availableSlots = parking.slots.filter(s => s.status === 'available').length;

      return res.status(201).json({
        success: true,
        message: `Slot ${slotNumber} added successfully (Fallback mode)`,
        data: newSlot,
      });
    }

    return res.status(404).json({ message: 'Parking facility not found' });
  } catch (error) {
    console.error('[Add Slot Error]:', error);
    res.status(500).json({ message: 'Error adding slot to parking' });
  }
};



