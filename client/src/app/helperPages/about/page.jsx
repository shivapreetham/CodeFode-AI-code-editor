"use client";
import { useEffect, useState } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import "../helper.css"

export default function About() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 200);
  }, []);

  return (
    <main className="bg_full">
      <Header />
      <div className="container">
        <h1 className={`title ${isVisible ? "visible" : ""}`}>
          About Our Platform 🎯
        </h1>
        <p className="description">
          Our mission is to make coding collaboration seamless, efficient, and fun.
        </p>
      </div>
      <Footer />
    </main>
  );
}
