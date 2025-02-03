"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const[loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials");
      setLoading(false);
    } else {
      router.push("/");
      setLoading(false);
    }    
  };

  return (
    <div className="bg-gradient-to-tl from-black to-gray-700 flex min-h-screen flex-col items-center justify-center py-16 px-8 sm:px-24">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg border border-gray-200 rounded-lg shadow-xl">
        <h2 className="text-3xl font-semibold text-white text-center mb-6">
          Login
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-100/50 border placeholder-white border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-100/50 border placeholder-white border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-gray-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all duration-300"
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>

          <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-300">
            or{" "}
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg mt-2 transition"
            >
              Continue with Google
            </button>
          </div>

          <div className="text-center text-sm text-white mt-4">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-blue-400 hover:underline">
              Register
            </a>
          </div>
          <div className="text-center text-sm text-white mt-4">
            Forgot Password?{" "}
            <a
              href="/forgot-password"
              className="text-blue-400 hover:underline"
            >
              Reset Password
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
