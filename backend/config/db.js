import mongoose from 'mongoose';
import User from '../models/User.js';
import Parking from '../models/Parking.js';
import ParkingSlot from '../models/ParkingSlot.js';

let mongoMemoryServer = null;

const sampleParkingLocations = [
  {
    name: 'Central Metro Tech Park Parking',
    address: '102 Tech Boulevard, City Center, Sector 4',
    city: 'City Center',
    distance: '0.8 km',
    pricePerHour: 40,
    availableSlots: 8,
    totalSlots: 12,
    status: 'Active',
    rating: 4.8,
    type: 'Multi-level Covered',
    facilities: ['EV Fast Charging', '24/7 Security & CCTV', 'Covered Bay', 'Disabled Access'],
    coordinates: { lat: 12.9716, lng: 77.5946 },
    aiPrediction: {
      currentOccupancy: 70,
      predictedOccupancy1hr: 85,
      predictedOccupancy2hr: 92,
      peakHours: '09:00 AM - 11:30 AM & 05:00 PM - 07:30 PM',
      recommendation: 'High demand expected in 1 hour. Reserve now to guarantee your spot.',
    },
  },
  {
    name: 'Grand Mall Underground Plaza',
    address: '45 Commercial Avenue, Downtown West',
    city: 'Downtown',
    distance: '1.4 km',
    pricePerHour: 50,
    availableSlots: 6,
    totalSlots: 12,
    status: 'Active',
    rating: 4.6,
    type: 'Underground Basement',
    facilities: ['Valet Assistance', 'CCTV Surveillance', 'Automated Boom Barrier'],
    coordinates: { lat: 12.9789, lng: 77.5912 },
    aiPrediction: {
      currentOccupancy: 92,
      predictedOccupancy1hr: 98,
      predictedOccupancy2hr: 100,
      peakHours: '01:00 PM - 04:00 PM',
      recommendation: 'Parking almost full. Consider Central Metro Tech Park as alternative.',
    },
  },
  {
    name: 'University Station Smart Garage',
    address: '12 College Road, Near North Gate',
    city: 'North Gate',
    distance: '2.1 km',
    pricePerHour: 30,
    availableSlots: 9,
    totalSlots: 12,
    status: 'Active',
    rating: 4.9,
    type: 'Surface Open Parking',
    facilities: ['24/7 Access', 'EV Fast Charging', 'Mobile Payment'],
    coordinates: { lat: 12.9654, lng: 77.6011 },
    aiPrediction: {
      currentOccupancy: 36,
      predictedOccupancy1hr: 45,
      predictedOccupancy2hr: 50,
      peakHours: '08:30 AM - 10:30 AM',
      recommendation: 'Plenty of slots available. Fast check-in estimated.',
    },
  },
  {
    name: 'Indiranagar 100ft Road Smart Hub',
    address: '742 100 Feet Road, Indiranagar',
    city: 'Indiranagar',
    distance: '3.8 km',
    pricePerHour: 45,
    availableSlots: 7,
    totalSlots: 12,
    status: 'Active',
    rating: 4.7,
    type: 'Multi-level Automated',
    facilities: ['EV Charging', 'Automated Barrier', 'CCTV 24/7'],
    coordinates: { lat: 12.9719, lng: 77.6412 },
    aiPrediction: {
      currentOccupancy: 45,
      predictedOccupancy1hr: 60,
      predictedOccupancy2hr: 75,
      peakHours: '06:00 PM - 09:30 PM',
      recommendation: 'Evening shopping peak expected. Reserve early.',
    },
  },
  {
    name: 'Koramangala 5th Block Hub',
    address: '18 Jyoti Nivas College Road, Koramangala',
    city: 'Koramangala',
    distance: '4.5 km',
    pricePerHour: 35,
    availableSlots: 8,
    totalSlots: 12,
    status: 'Active',
    rating: 4.8,
    type: 'Covered Bay',
    facilities: ['Valet Service', 'EV Fast Charging', 'Digital QR Entry'],
    coordinates: { lat: 12.9352, lng: 77.6245 },
    aiPrediction: {
      currentOccupancy: 50,
      predictedOccupancy1hr: 65,
      predictedOccupancy2hr: 80,
      peakHours: '12:00 PM - 03:00 PM & 07:00 PM - 11:00 PM',
      recommendation: 'Popular cafe zone. Ample spots currently free.',
    },
  },
  {
    name: 'Whitefield ITPL Cyber Park',
    address: 'Plot 3, International Tech Park, Whitefield Main Rd',
    city: 'Whitefield',
    distance: '14.2 km',
    pricePerHour: 40,
    availableSlots: 10,
    totalSlots: 12,
    status: 'Active',
    rating: 4.9,
    type: 'Multi-level Covered',
    facilities: ['Corporate Valet', 'EV Supercharging', 'Security Escort', 'Disabled Access'],
    coordinates: { lat: 12.9854, lng: 77.7289 },
    aiPrediction: {
      currentOccupancy: 60,
      predictedOccupancy1hr: 70,
      predictedOccupancy2hr: 85,
      peakHours: '09:00 AM - 12:00 PM',
      recommendation: 'Tech corridor facility with fast digital check-in.',
    },
  },
];

export const autoSeedIfEmpty = async () => {
  try {
    const parkingCount = await Parking.countDocuments();
    if (parkingCount === 0) {
      console.log('[Database Seed] Seeding initial data into MongoDB...');

      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@smartpark.ai',
        password: 'password123',
        role: 'admin',
      });

      const owner = await User.create({
        name: 'Sarah Jenkins',
        email: 'sarah.j@parkingsolutions.com',
        password: 'password123',
        role: 'owner',
      });

      const driver = await User.create({
        name: 'Alex Morgan',
        email: 'alex.m@example.com',
        password: 'password123',
        role: 'user',
        phone: '+91 98765 43210',
        vehicle: 'KA-05-EV-4092',
      });

      for (let index = 0; index < sampleParkingLocations.length; index++) {
        const lot = sampleParkingLocations[index];
        const createdLot = await Parking.create({
          ...lot,
          owner: owner._id,
        });

        const slotNames = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];

        const slotDocs = slotNames.map((name, i) => {
          let status = 'available';
          if (i === 1 || i === 5 || i === 9) status = 'occupied';
          if (i === 3) status = 'reserved';

          return {
            parking: createdLot._id,
            slotNumber: name,
            floor: name.startsWith('A') ? 'Level 1' : name.startsWith('B') ? 'Level 2' : 'Level 3',
            type: i % 4 === 0 ? 'EV Charging' : 'Standard',
            status,
            price: createdLot.pricePerHour,
          };
        });

        await ParkingSlot.insertMany(slotDocs);

        const realAvail = slotDocs.filter((s) => s.status === 'available').length;
        await Parking.findByIdAndUpdate(createdLot._id, {
          availableSlots: realAvail,
          totalSlots: slotDocs.length,
          status: realAvail === 0 ? 'Full' : 'Active',
        });
      }

      console.log('[Database Seed] ✅ Seeding complete!');
      console.log('[Database Seed]    admin@smartpark.ai / password123');
      console.log('[Database Seed]    sarah.j@parkingsolutions.com / password123');
      console.log('[Database Seed]    alex.m@example.com / password123');
    }
  } catch (err) {
    console.error('[Database Seed Error]:', err.message);
  }
};

export const connectDB = async () => {
  // Try local MongoDB first (fast)
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartpark_ai';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] ✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    await autoSeedIfEmpty();
    return true;
  } catch (error) {
    console.warn('[Database] Local MongoDB not found. Starting MongoMemoryServer (in-memory)...');
  }

  // Fallback to MongoMemoryServer (bundled binary, no install needed)
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');

    console.log('[Database] Downloading/starting MongoMemoryServer binary (first run may take 30-60 seconds)...');
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'smartpark_ai',
      },
    });

    const uri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`[Database] ✅ MongoMemoryServer connected: ${conn.connection.host}`);
    console.log('[Database]    (Data is in-memory; resets on server restart)');

    await autoSeedIfEmpty();
    return true;
  } catch (mmsErr) {
    console.error('[Database] ❌ Failed to start MongoMemoryServer:', mmsErr.message);
    console.error('[Database]    Register/Login will NOT work until a MongoDB connection is established.');
    return false;
  }
};

export default connectDB;
