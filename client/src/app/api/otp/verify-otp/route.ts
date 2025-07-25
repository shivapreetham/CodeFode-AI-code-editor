import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/connectDB";
import Otp from "../../models/Otp.model";
import { hash } from "bcryptjs";
import UserModel from "../../models/User.model";

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

    const { email, otp, useCase, password, name } = reqBody;

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

    if (useCase === "register") {
      if (!name || !password) {
        return NextResponse.json(
          { error: "Name and Password are required" },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }
      const hashedPassword = await hash(password, 6);
      const newUser = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        provider: "credentials",
      });
      if (!newUser) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    }

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
