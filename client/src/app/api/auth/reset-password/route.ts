// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import connectDB from "../../connectDB";
import User from "../../models/User.model";
import { ResponseData } from "../../../../../types/route";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ResponseData>> {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          status: 400,
          message: "Email and password are required!",
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          status: 400,
          message: "Password must be at least 6 characters long",
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        {
          status: 404,
          message: "User not found",
          success: false,
          data: null,
        },
        { status: 404 }
      );
    }

    // Check if user is a Google-authenticated user
    if (user.provider === "google") {
      return NextResponse.json(
        {
          status: 400,
          message:
            "Password reset not available for Google-authenticated users",
          success: false,
          data: null,
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    // Update the user's password
    await User.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
        },
      }
    );

    return NextResponse.json(
      {
        status: 200,
        message: "Password updated successfully",
        data: null,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        status: 500,
        message: "Internal server error",
        data: null,
        success: false,
      },
      { status: 500 }
    );
  }
}
