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
    className="text-4xl md:text-5xl lg:text-6xl font-extrabold px-8 sm:px-0 mb-4 text-gray-600 dark:text-neutral-200 drop-shadow-md"
  />

  <motion.p
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1, delay: 1.5 }}
    className="text-lg lg:text-xl lg:px-16 font-normal text-gray-500 dark:text-gray-500 mb-10"
  >
    A comprehensive resource hub for RUET CSE students, providing access to
    notes, code libraries, academic materials, alumni network and study
    materials all in one place.
  </motion.p>

  {/* Download Button with Edgy Box Shadow */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 2 }}
    className="relative group"
  >
    {/* Animated Border with Gradient */}
    <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-blue-600 via-red-600 to-pink-600 bg-[length:300%_300%] animate-gradient-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
    
    {/* Main Button with Specified Box Shadow */}
    <a
      href="https://drive.google.com/file/d/15VpHe2kHByPbEobMpoP7kDLoCs5F3U9Y/view?usp=drive_link"
      download
      className="relative flex items-center gap-4 px-8 py-4 bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 hover:border-transparent transition-all duration-300"
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset'
      }}
    >
      {/* App Icon with Gradient */}
      <div className="flex-shrink-0">
        <img 
          src="/images/semicolon.png" 
          alt="Semicolon Logo"
          className="w-[50px] rounded-lg object-contain shadow-lg "
        />
      </div>

      {/* App Info */}
      <div className="flex items-center gap-4">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-800 dark:text-white tracking-tight">
              Semicolon
            </span>
            
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">
              Faster
            </span>
            <span className="text-[8px] text-neutral-400 dark:text-neutral-600">•</span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">
              Optimized
            </span>
            <span className="text-[8px] text-neutral-400 dark:text-neutral-600">•</span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">
              In App Experience
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-neutral-300 dark:via-neutral-700 to-transparent"></div>

        {/* Download Section */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Download APK
          </span>
          <svg 
            className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-y-0.5 transition-all duration-300" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" 
            />
          </svg>
        </div>
      </div>
    </a>
  </motion.div>
</div>
  );
}
