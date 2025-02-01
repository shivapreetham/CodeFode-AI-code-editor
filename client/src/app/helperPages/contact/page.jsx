"use client";
import { useEffect, useState } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import "../helper.css";
import Image from "next/image";

const creators = [
  {
    name: "John Doe",
    github: "https://github.com/johndoe",
    linkedin: "https://www.linkedin.com/in/johndoe",
    email: "johndoe@example.com",
  },
  {
    name: "Jane Smith",
    github: "https://github.com/janesmith",
    linkedin: "https://www.linkedin.com/in/janesmith",
    email: "janesmith@example.com",
  },
  {
    name: "Alice Johnson",
    github: "https://github.com/alicejohnson",
    linkedin: "https://www.linkedin.com/in/alicejohnson",
    email: "alicejohnson@example.com",
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