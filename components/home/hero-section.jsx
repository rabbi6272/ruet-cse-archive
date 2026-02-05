"use client";
import { motion } from "framer-motion";

import BlurText from "./hero-blur-text";

export function HeroSection() {
  return (
    <div className="hero-section w-full lg:max-w-4xl px-2 flex flex-col items-center mx-auto my-40 xl:my-34 text-center">
      <BlurText
        text="Welcome to RUET CSE Archive!"
        delay={50}
        animateBy="letters"
        direction="bottom"
        className="text-4xl md:text-5xl lg:text-6xl font-extrabold px-8 sm:px-0 mb-4 text-gray-600 dark:text-neutral-300"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="text-lg lg:text-xl lg:px-16 font-normal text-gray-500 dark:text-gray-400"
      >
        Here we share study materials and essential resources provided by our
        humble seniors, along with guidelines for future studies and job
        sectors.
      </motion.p>
      {/* <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl font-extrabold">
        <span className="block md:hidden text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
          Welcome to <br /> RUET CSE Archive!
        </span>
        <span className="hidden md:block text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
          Welcome to RUET CSE Archive!
        </span>
      </h1>
   */}
    </div>
  );
}
