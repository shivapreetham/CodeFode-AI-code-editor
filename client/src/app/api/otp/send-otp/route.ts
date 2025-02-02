import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../connectDB";
import Otp from "../../models/Otp.model";
import { sendEmail } from "../../sendMail";

// Connect to MongoDB

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const reqBody = await request.json();
    const { email } = reqBody;

    // Validate email
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Calculate expiry time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing OTP for this email
    await Otp.deleteMany({ email });

    // Save new OTP to database
    const newOtp = new Otp({
      email,
      otp,
      expiresAt,
    });
    await newOtp.save();

    // Prepare email content
    const emailSubject = "Your OTP Code";
    const emailText = `Your OTP code is: ${otp}. This code will expire in 5 minutes.`;
    const emailHtml = `
      <h1>OTP Verification</h1>
      <p>Your OTP code is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `;

    // Send email
    const emailSent = await sendEmail({
      receiver: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send OTP email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "OTP sent successfully",
        success: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
