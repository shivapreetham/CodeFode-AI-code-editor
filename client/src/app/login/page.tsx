"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          Login
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 bg-transparent border-b border-gray-400 text-white outline-none focus:border-white"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-transparent border-b border-gray-400 text-white outline-none focus:border-white"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <div className="text-center text-white mt-4">
          <p className="text-sm">or</p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg mt-2 transition"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-sm text-white text-center mt-4">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
