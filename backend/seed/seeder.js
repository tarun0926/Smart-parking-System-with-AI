import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Parking from '../models/Parking.js';
import ParkingSlot from '../models/ParkingSlot.js';

dotenv.config();

const sampleParkingLocations = [
  {
    name: 'Central Metro Tech Park Parking',
    address: '102 Tech Boulevard, City Center, Sector 4',
    city: 'City Center',
    distance: '0.8 km',
    pricePerHour: 40,
    availableSlots: 18,
    totalSlots: 60,
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
    totalSlots: 80,
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
    availableSlots: 32,
    totalSlots: 50,
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
];

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Clearing old records...');
    await User.deleteMany();
    await Parking.deleteMany();
    await ParkingSlot.deleteMany();

    console.log('[Seeder] Inserting sample users...');
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

    console.log('[Seeder] Inserting sample parking locations & slots...');
    for (let index = 0; index < sampleParkingLocations.length; index++) {
      const lot = sampleParkingLocations[index];
      const createdLot = await Parking.create({
        ...lot,
        owner: owner._id,
      });

      const slotNames = [
        'A1', 'A2', 'A3', 'A4',
        'B1', 'B2', 'B3', 'B4',
        'C1', 'C2', 'C3', 'C4'
      ];

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

    console.log('[Seeder] Database seeding completed successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedData();

