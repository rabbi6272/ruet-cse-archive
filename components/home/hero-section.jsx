"use client";
import { motion } from "framer-motion";

import { HeroBlurText } from "./hero-blur-text";

export function HeroSection() {
  return (
    <div className="hero-section w-full lg:max-w-4xl px-2 flex flex-col items-center mx-auto my-40 xl:my-34 text-center">
      <HeroBlurText
        text="Welcome to RUET CSE Archive!"
        delay={30}
        animateBy="letters"
        direction="bottom"
        className="text-4xl md:text-5xl lg:text-6xl font-extrabold px-8 sm:px-0 mb-4 text-gray-600 dark:text-neutral-300"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="text-lg lg:text-xl lg:px-16 font-normal text-gray-500 dark:text-gray-400"
      >
        A comprehensive resource hub for RUET CSE students, providing access to
        notes, code libraries, academic materials, alumni network and study
        materials all in one place.
      </motion.p>
    </div>
  );
}
