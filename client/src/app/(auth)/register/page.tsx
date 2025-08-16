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
        useCase: "register",
        password: form.password,
        name: form.name,
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
    <div className="hero min-h-screen bg-gradient-to-tl from-base-300 to-base-100">
      <div className="hero-content text-center">
        <div className="card w-full max-w-md shadow-2xl bg-base-100">
          <div className="card-body">
            <h2 className="card-title text-3xl font-bold justify-center mb-6">
              {step === "register" ? "Register" : step === "otp" ? "Verify OTP" : "Success"}
            </h2>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            {step === "register" ? (
              // Registration Form
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="form-control">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div className="form-control">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div className="form-control">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                </div>
              </form>
            ) : step === "otp" ? (
              // OTP Verification Form
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="alert alert-info">
                  <span>We've sent an OTP to your email. Enter it below.</span>
                </div>
                <div className="form-control">
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className={`btn btn-success w-full ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </form>
            ) : (
              // Verified Message & Redirect
              <div className="text-center space-y-4">
                <div className="alert alert-success">
                  <span>OTP Verified Successfully! 🎉</span>
                </div>
                <button
                  onClick={() => router.push("/login")}
                  className="btn btn-primary w-full"
                >
                  Go to Login
                </button>
              </div>
            )}

            {step === "register" && (
              <>
                <div className="divider">OR</div>
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="btn btn-outline btn-error w-full"
                >
                  Sign up with Google
                </button>
              </>
            )}

            {step !== "verified" && (
              <div className="text-center mt-6">
                <p className="text-sm">
                  Already have an account?{" "}
                  <a href="/login" className="link link-primary">
                    Login
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
