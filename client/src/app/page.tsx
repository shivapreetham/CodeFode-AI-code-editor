"use client";
import axios from "axios";
import { useEffect } from "react";
import "./page.css";
import Header from "./components/header/Header";
import Image from "next/image";
import Footer from "./components/footer/Footer";
import { motion } from "framer-motion";

export default function Home() {
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
  }, []);

  return (
    <main className="bg_full">
      <Header />
      <div>
        <div className="h-[300px] sm:h-[500px] flex flex-col justify-center items-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="text-2xl sm:text-4xl xl:text-6xl font-bold text-white text-center"
          >
            A real-time collaborative code editor
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75 }}
            className="text-md text-center mt-2 sm:text-2xl sm:mt-4 font-light text-white"
          >
            For developers, anytime, anywhere.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.5, transform: "translateY(100px)" }}
            animate={{ opacity: 1, scale: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.75 }}
            className="mt-10"
          >
            <a
              href="/join"
              className="px-8 py-2 text-md sm:py-3 bg-[var(--brand-color)] hover:bg-[#f130eeaf] text-white rounded-lg sm:text-lg"
            >
              Try It Now
            </a>
          </motion.div>
        </div>
        <div className="code_editor_img_cover flex justify-center items-center mb-28 sm:mb-40">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="w-[90%] lg:w-auto code_editor_img border border-[#afafaf] rounded-lg p-3 sm:p-5"
          >
            <Image
              width={1200}
              height={1200}
              className="w-full h-auto"
              src="/assets/codesocket_editor_ui.png"
              alt="codesocket editor screenshot"
            />
          </motion.div>
        </div>
      </div>
      <div
        id="starIt"
        className="flex flex-col items-center justify-center mb-24 sm:mb-32 gap-2"
      >
        <motion.h2
          initial={{ opacity: 0, transform: "translateY(100px)" }}
          whileInView={{ opacity: 1, transform: "translateY(0px)" }}
          viewport={{ once: true, amount: "some" }}
          transition={{ duration: 0.75 }}
          className="text-2xl sm:text-4xl font-bold text-white text-center"
        >
          Welcome
        </motion.h2>
        <motion.h2
          initial={{ opacity: 0, transform: "translateY(100px)" }}
          whileInView={{ opacity: 1, transform: "translateY(0px)" }}
          viewport={{ once: true, amount: "some" }}
          transition={{ duration: 0.75, delay: 0.5 }}
          className="text-sm sm:text-xl text-white text-center"
        >
          I hope you will enjoy our project...
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, transform: "translateY(100px)" }}
          whileInView={{ opacity: 1, transform: "translateY(0px)" }}
          viewport={{ once: true, amount: "some" }}
          transition={{ duration: 0.75, delay: 0.5 }}
          className="flex items-center mt-5"
        ></motion.div>
      </div>
      <Footer />
    </main>
  );
}
