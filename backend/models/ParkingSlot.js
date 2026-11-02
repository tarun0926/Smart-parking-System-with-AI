import mongoose from 'mongoose';

const parkingSlotSchema = new mongoose.Schema(
  {
    parking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parking',
      required: true,
    },
    slotNumber: {
      type: String,
      required: [true, 'Please provide slot bay number (e.g. A-101)'],
    },
    floor: {
      type: String,
      default: 'Level 1',
    },
    type: {
      type: String,
      enum: ['Standard', 'EV Charging', 'VIP', 'Disabled'],
      default: 'Standard',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    price: {
      type: Number,
      default: 40,
    },
  },
  {
    timestamps: true,
  }
);

export const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);
export default ParkingSlot;
