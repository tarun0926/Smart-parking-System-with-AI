import mongoose from 'mongoose';

const parkingHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parking',
      required: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
    },
    checkInTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
    },
    totalFee: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const ParkingHistory = mongoose.model('ParkingHistory', parkingHistorySchema);
export default ParkingHistory;
