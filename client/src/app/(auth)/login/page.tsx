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
    <div className="hero min-h-screen bg-gradient-to-tl from-base-300 to-base-100">
      <div className="hero-content text-center">
        <div className="card w-full max-w-md shadow-2xl bg-base-100">
          <div className="card-body">
            <h2 className="card-title text-3xl font-bold justify-center mb-6">
              Login
            </h2>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="form-control">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  {loading ? "Loading..." : "Login"}
                </button>
              </div>

              <div className="divider">or</div>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="btn btn-outline btn-error w-full"
              >
                Continue with Google
              </button>

              <div className="text-center mt-6 space-y-2">
                <p className="text-sm">
                  Don&apos;t have an account?{" "}
                  <a href="/register" className="link link-primary">
                    Register
                  </a>
                </p>
                <p className="text-sm">
                  Forgot Password?{" "}
                  <a href="/forgot-password" className="link link-primary">
                    Reset Password
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
