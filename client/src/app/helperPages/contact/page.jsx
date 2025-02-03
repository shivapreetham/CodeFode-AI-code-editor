"use client";
import { useEffect, useState } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import "../helper.css";
import Image from "next/image";

const creators = [
  {
    name: "Pritam Roy",
    github: "https://github.com/HiiiiiPritam",
    linkedin: "https://www.linkedin.com/in/pritam-roy-95185328a",
    email: "ratsdust4226@gmail.com",
  },
  {
    name: "Aditya Raj",
    github: "https://github.com/raj-adi00",
    linkedin: "www.linkedin.com/in/aditya-raj-338a8527a",
    email: "adi.adityakohli2005@gmail.com",

  },
  {
    name: "Shivapreetham H.S.",
    github: "https://github.com/shivapreetham",
    linkedin: "www.linkedin.com/in/shivapreetham",
    email: "2023ugcs120@nitjsr.ac.in",
  },
];

export default function Contact() {
  return (
    <main className="bg_full">
      <Header />
      <div className="h-[300px] sm:h-[400px] flex flex-col justify-center items-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white text-center">
          Get in Touch
        </h1>
        <h2 className="text-lg text-center mt-2 sm:text-2xl font-light text-gray-300">
          Connect with the creators behind this project.
        </h2>
      </div>

      <div className="flex flex-col items-center mb-20 px-4 sm:px-10">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-10">
          Meet the Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
          {creators.map((creator, index) => (
            <div key={index} className="card text-center">
              <h3 className="text-xl font-bold text-white">{creator.name}</h3>
              <div className="flex justify-center gap-4 mt-4">
                {/* GitHub */}
                <a href={creator.github} target="_blank" rel="noopener noreferrer">
                  <Image
                    src="/github.svg"
                    alt="GitHub"
                    width={32}
                    height={32}
                    className="hover:scale-110 transition-transform text-white"
                  />
                </a>
                {/* LinkedIn */}
                <a href={creator.linkedin} target="_blank" rel="noopener noreferrer">
                  <Image
                    src="/linkedin.svg"
                    alt="LinkedIn"
                    width={32}
                    height={32}
                    className="hover:scale-110 transition-transform"
                  />
                </a>
                {/* Email */}
                <a href={`mailto:${creator.email}`}>
                  <Image
                    src="/mail.svg"
                    alt="Email"
                    width={32}
                    height={32}
                    className="hover:scale-110 transition-transform"
                  />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}