import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
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
      required: true,
    },
    slotNumber: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    totalHours: {
      type: Number,
      required: true,
      default: 1,
    },
    amount: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Cancelled', 'Pending'],
      default: 'Active',
    },
    vehicleNumber: {
      type: String,
      default: 'KA-05-EV-4092',
    },
    qrCodeId: {
      type: String,
      default: function () {
        return `SP-QR-${Math.floor(1000 + Math.random() * 9000)}`;
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to synchronize amount and totalPrice
bookingSchema.pre('save', function (next) {
  if (this.amount && !this.totalPrice) {
    this.totalPrice = this.amount;
  } else if (this.totalPrice && !this.amount) {
    this.amount = this.totalPrice;
  }
  next();
});

export const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;

