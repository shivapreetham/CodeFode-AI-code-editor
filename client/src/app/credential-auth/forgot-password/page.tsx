// src/app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/otp/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      setStep("otp");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/otp/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error("Invalid OTP");
      }

      setStep("password");
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: newPassword }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      router.push("/login");
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-tl from-black to-gray-700 flex min-h-screen flex-col items-center justify-center py-16 px-8 sm:px-24">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg border border-gray-200 rounded-lg shadow-xl">
        <h2 className="text-3xl font-semibold text-white text-center mb-6">
          Forgot Password
        </h2>

        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        {step === "email" && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-100/50 border placeholder-white border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 bg-gray-100/50 border placeholder-white border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 bg-gray-100/50 border placeholder-white border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-gray-100/50 border placeholder-white border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
