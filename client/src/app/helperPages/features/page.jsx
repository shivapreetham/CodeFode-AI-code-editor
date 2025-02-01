"use client";
import { useEffect, useState } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import "../helper.css";

export default function Features() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 200);
  }, []);

  return (
    <main className="bg_full">
      <Header />
      <div className="container">
        <h1 className={`title ${isVisible ? "visible" : ""}`}>
          Amazing Features 🚀
        </h1>
        <p className="description">
          Experience real-time collaboration, AI-assisted coding, and secure environments.
        </p>

        <div className="features-list">
          <div className="feature-card">Live Collaboration</div>
          <div className="feature-card">AI Code Assistance</div>
          <div className="feature-card">Secure & Encrypted Coding</div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
