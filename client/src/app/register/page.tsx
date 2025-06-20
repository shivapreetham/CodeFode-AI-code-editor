"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState(""); // OTP state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("register"); // "register" -> "otp" -> "verified"

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Register User
      const res = await axios.post("/api/auth/register", {
        ...form,
        provider: "credentials",
      });

      if (res.status === 201) {
        // Send OTP after successful registration
        await axios.post("/api/otp/send-otp", { email: form.email });
        setStep("otp"); // Move to OTP step
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    }

    setLoading(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verify OTP
      const res = await axios.post("/api/otp/verify-otp", {
        email: form.email,
        otp,
      });

      if (res.status === 200) {
        setStep("verified"); // OTP verified, move to login
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tl from-black to-gray-700">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg border text-white border-gray-200 rounded-lg shadow-xl">
        <h2 className="text-3xl font-semibold text-white text-center mb-6">
          {step === "register" ? "Register" : "Verify OTP"}
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        {step === "register" ? (
          // Registration Form
          <form onSubmit={handleRegister} className="space-y-6">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-100/50 border placeholder-white text-white border-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-100/50 border placeholder-white border-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-100/50 border placeholder-white border-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        ) : step === "otp" ? (
          // OTP Verification Form
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <p className="text-center text-sm text-white">
              We&apos;ve sent an OTP to your email. Enter it below.
            </p>
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full p-3 bg-gray-100/50 border placeholder-white text-white border-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
            />
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        ) : (
          // Verified Message & Redirect
          <div className="text-center">
            <p className="text-green-400 text-lg font-semibold">
              OTP Verified Successfully! 🎉
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
            >
              Go to Login
            </button>
          </div>
        )}

        {step === "register" && (
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-600"></div>
              <p className="mx-2 text-gray-400 text-sm">OR</p>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              Sign up with Google
            </button>
          </>
        )}

        {step !== "verified" && (
          <p className="text-sm text-center text-white mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-blue-400 hover:underline">
              Login
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
