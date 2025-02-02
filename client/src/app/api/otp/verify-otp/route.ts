import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../connectDB";
import Otp from "../../models/Otp.model";

// Connect to MongoDB

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    // Parse and validate request body
    let reqBody;
    try {
      reqBody = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { email, otp } = reqBody;

    // Validate inputs
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Find the OTP document
    const otpDoc = await Otp.findOne({
      email,
      otp,
      expiresAt: { $gt: new Date() }, // Check if OTP hasn't expired
    });

    if (!otpDoc) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Delete the used OTP
    await Otp.deleteOne({ _id: otpDoc._id });

    return NextResponse.json(
      {
        message: "OTP verified successfully",
        success: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in /api/verify-otp:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
