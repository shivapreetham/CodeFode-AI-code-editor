import mongoose, { Document, Schema, Model } from "mongoose";

interface IOtp extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 300 }, // Expires after 5 minutes
});

// **Fix: Check if model already exists before defining it**
const Otp: Model<IOtp> = mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);

export default Otp;
