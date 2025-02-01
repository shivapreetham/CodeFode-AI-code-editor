"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi"; // Icons for better UX

const Header = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 left-0 z-50">
      <nav className="backdrop-blur-lg bg-gray-900 bg-opacity-50 border border-gray-800 px-4 lg:px-6 py-3 rounded-lg shadow-lg mx-4 mt-4">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center text-white text-2xl font-semibold">
            Code<span className="text-green-400">-Fode💻</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white p-2 rounded-lg hover:bg-gray-800 transition"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Desktop Menu */}
          <div className={`lg:flex items-center ${isOpen ? "block" : "hidden"} w-full lg:w-auto`}>
            <ul className="flex flex-col lg:flex-row lg:space-x-8 mt-4 lg:mt-0 text-white">
              <li>
                <Link href="/" className="px-4 py-2 rounded-lg hover:text-green-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/helperPages/features"
                  className="px-4 py-2 rounded-lg hover:text-green-400 transition"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/helperPages/about"
                  className="px-4 py-2 rounded-lg hover:text-green-400 transition"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/helperPages/contact"
                  className="px-4 py-2 rounded-lg hover:text-green-400 transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* join/Login Button */}
          <div className="flex items-center">
            {session ? (
              <Link
                href="/join"
                className="text-white border border-green-400 hover:bg-green-400 hover:text-black font-medium rounded-lg text-sm px-4 py-2 transition"
              >
                Join
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-white border border-green-400 hover:bg-green-400 hover:text-black font-medium rounded-lg text-sm px-4 py-2 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
