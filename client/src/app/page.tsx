"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import "./page.css";
import Header from "./components/header/Header";
import Image from "next/image";
import Footer from "./components/footer/Footer";
import { motion } from "framer-motion";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const { data: session } = useSession();
  // To activate the server
  const handleServerWakeUp = async () => {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      try {
        await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL);
      } catch (error) {
        console.log(error);
      }
    }
  };
  useEffect(() => {
    handleServerWakeUp();
    setTimeout(() => setIsVisible(true), 200);
  }, []);

  return (
    <main className="bg_full">
      <Header />
      <div>
        {/* Hero Section */}
        <div className="h-[300px] sm:h-[500px] flex flex-col justify-center items-center">
          <h1
            className={`text-3xl sm:text-5xl xl:text-7xl font-extrabold text-white text-center transition-all duration-500 transform ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          >
            Code. Collaborate.{" "}
            <span className="text-[var(--brand-color)] text-glow">
              Conquer.
            </span>
          </h1>
          <h2
            className={`text-lg text-center mt-2 sm:text-2xl sm:mt-4 font-light text-gray-300 transition-all duration-700 transform ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          >
            Where <span className="font-semibold text-white">ideas</span> meet{" "}
            <span className="font-semibold text-white">execution</span> in
            real-time.
          </h2>
          <div
            className={`mt-10 transition-all duration-500 transform ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {session ? (
              <a
                href="/join"
                className="px-8 py-2 text-lg sm:py-3 bg-[var(--brand-color)] hover:bg-[#50882e] text-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Start Coding Now 🚀
              </a>
            ) : (
              <a
                href="/login"
                className="px-8 py-2 text-lg sm:py-3 bg-[var(--brand-color)] hover:bg-[#50882e] text-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Start Coding Now 🚀
              </a>
            )}
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-center mb-10 sm:mb-40">
          {/* Section Heading */}
          <h2 className="text-center text-3xl sm:text-5xl font-extrabold text-white mb-8">
            <span className="text-[var(--brand-color)]">Next-Level</span> Code
            Collaboration
          </h2>
          <p className="text-center text-gray-300 text-md sm:text-lg max-w-2xl mb-12">
            Code together in real-time with{" "}
            <span className="text-green-600 font-bold">zero latency</span>,
            <span className="text-blue-300 font-bold">
              {" "}
              AI-powered assistance
            </span>
            , and{" "}
            <span className="text-yellow-200 font-bold">
              secure environments
            </span>
            .
          </p>

          {/* Floating Cards Section */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
            {/* Card 1: Live Collaboration */}
            <div className="card">
              <div className="icon bg-green-500">
                <i className="fas fa-users"></i>
              </div>
              <h3 className="text-xl font-bold text-white">
                Live Collaboration
              </h3>
              <p className="text-gray-300 text-sm">
                Work with teammates in real-time, no delays.
              </p>
            </div>

            {/* Card 2: AI Assistance */}
            <div className="card">
              <div className="icon bg-blue-500">
                <i className="fas fa-robot"></i>
              </div>
              <h3 className="text-xl font-bold text-white">AI Assistance</h3>
              <p className="text-gray-300 text-sm">
                Get AI-powered code suggestions & debugging.
              </p>
            </div>

            {/* Card 3: Secure Coding */}
            <div className="card">
              <div className="icon bg-red-500">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="text-xl font-bold text-white">
                Secure & Encrypted
              </h3>
              <p className="text-gray-300 text-sm">
                Your code stays private with end-to-end encryption.
              </p>
            </div>

            {/* Card 4: Instant Debugging */}
            <div className="card">
              <div className="icon bg-yellow-500">
                <i className="fas fa-bug"></i>
              </div>
              <h3 className="text-xl font-bold text-white">
                Instant Debugging
              </h3>
              <p className="text-gray-300 text-sm">
                Find and fix errors effortlessly.
              </p>
            </div>

            {/* Card 5: Multi-Device Access */}
            <div className="card">
              <div className="icon bg-purple-500">
                <i className="fas fa-laptop-code"></i>
              </div>
              <h3 className="text-xl font-bold text-white">
                Multi-Device Access
              </h3>
              <p className="text-gray-300 text-sm">
                Code from any device, anywhere.
              </p>
            </div>

            {/* Card 6: Custom Themes */}
            <div className="card">
              <div className="icon bg-cyan-500">
                <i className="fas fa-paint-brush"></i>
              </div>
              <h3 className="text-xl font-bold text-white">Custom Themes</h3>
              <p className="text-gray-300 text-sm">
                Personalize your coding experience.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
