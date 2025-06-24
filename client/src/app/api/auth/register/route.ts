import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import connectDB from "../../connectDB";
import User from "../../models/User.model";
import { ResponseData } from "../../../../../types/route";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ResponseData>> {
  try {
    const { name, email, password, provider, googleId } = await req.json();

    if (!name || !email || !provider || !password) {
      return NextResponse.json(
        {
          status: 400,
          message: "Name, email, and provider are required!",
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    if(password.length < 6) {
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

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        {
          status: 409,
          message: "User already exists",
          success: false,
          data: null,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        status: 201,
        message: "User can proceed successfully",
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
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
