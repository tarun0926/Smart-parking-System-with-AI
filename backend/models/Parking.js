import mongoose from 'mongoose';

const parkingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a parking facility name'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    city: {
      type: String,
      default: 'City Center',
    },
    distance: {
      type: String,
      default: '1.0 km',
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Please specify hourly price'],
      default: 40,
    },
    availableSlots: {
      type: Number,
      default: 0,
    },
    totalSlots: {
      type: Number,
      required: [true, 'Please specify total slots capacity'],
      default: 50,
    },
    status: {
      type: String,
      enum: ['Active', 'Full', 'Maintenance'],
      default: 'Active',
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    type: {
      type: String,
      default: 'Multi-level Covered',
    },
    facilities: {
      type: [String],
      default: ['24/7 Security & CCTV', 'Covered Bay', 'Disabled Access'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    coordinates: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
    },
    aiPrediction: {
      currentOccupancy: { type: Number, default: 70 },
      predictedOccupancy1hr: { type: Number, default: 85 },
      predictedOccupancy2hr: { type: Number, default: 90 },
      peakHours: { type: String, default: '09:00 AM - 11:30 AM & 05:00 PM - 07:30 PM' },
      recommendation: { type: String, default: 'Moderate demand expected. Slots available.' },
    },
  },
  {
    timestamps: true,
  }
);

export const Parking = mongoose.model('Parking', parkingSchema);
export default Parking;
