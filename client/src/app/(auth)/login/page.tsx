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
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-base-200 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Login
        </h2>

        {error && (
          <div className="bg-error/10 text-error p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-base-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-base-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-content p-3 rounded font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>

          <div className="text-center text-sm text-base-content/70 my-4">or</div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full border border-base-300 p-3 rounded font-medium"
          >
            Continue with Google
          </button>

          <div className="text-center mt-6 space-y-2 text-sm">
            <p>
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-primary">
                Register
              </a>
            </p>
            <p>
              <a href="/forgot-password" className="text-primary">
                Forgot Password?
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
