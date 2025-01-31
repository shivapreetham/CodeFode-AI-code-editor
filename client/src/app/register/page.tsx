"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/auth/register", {
        ...form,
        provider: "credentials",
      });
      if (res.status === 201) {
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg w-[350px]">
        <h2 className="text-xl font-semibold text-white text-center">
          Register
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full bg-transparent border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full bg-transparent border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full bg-transparent border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-600"></div>
          <p className="mx-2 text-gray-400 text-sm">OR</p>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center bg-red-600 hover:bg-white/20 text-white py-2 rounded-md transition"
        >
          Sign up with Google
        </button>

        <p className="text-gray-400 text-sm text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
