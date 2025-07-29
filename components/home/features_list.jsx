"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

import { motion } from "framer-motion";

import image0 from "@/public/images/slideshow/image0.jpg";
import Link from "next/link";

// Counter animation component
function AnimatedCounter({ target, suffix = "", duration = 3000 }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.05 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startCount = 0;

    const updateCount = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(
        startCount + (target - startCount) * easeOutQuart
      );

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [isVisible, target, duration]);

  return (
    <span
      ref={counterRef}
      className="font-semibold text-gray-700 dark:text-gray-200"
    >
      {count}
      {suffix}
    </span>
  );
}

export function FeaturesList() {
  return (
    <>
      <div className="px-4">
        {/* Header Text Section*/}
        <div className="w-full lg:max-w-4xl flex flex-col items-center mx-auto text-center">
          <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl font-extrabold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
              Welcome to CSE Archive!
            </span>
          </h1>
          <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
            Here we share study materials and essential resources provided by
            our humble seniors, along with guidelines for future studies and job
            sectors.
          </p>
        </div>

        <br />
        <br />
        {/* Key Features Section */}
        <div className="w-full mx-auto flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
              Key Features
            </span>
          </h1>
          <ul className="space-y-4 text-center text-gray-500 dark:text-gray-400">
            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <svg
                className="shrink-0 w-3.5 h-3.5 text-green-500 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 16 12"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5.917 5.724 10.5 15 1.5"
                />
              </svg>
              <span>Access all materials from one place</span>
            </li>

            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <svg
                className="shrink-0 w-3.5 h-3.5 text-green-500 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 16 12"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5.917 5.724 10.5 15 1.5"
                />
              </svg>
              <span>Code Library to showcase your creativity</span>
            </li>

            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <svg
                className="shrink-0 w-3.5 h-3.5 text-green-500 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 16 12"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5.917 5.724 10.5 15 1.5"
                />
              </svg>
              <span>
                Available PDF files: <AnimatedCounter target={25} suffix="+" />
              </span>
            </li>

            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <svg
                className="shrink-0 w-3.5 h-3.5 text-green-500 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 16 12"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5.917 5.724 10.5 15 1.5"
                />
              </svg>
              <span>
                Code snippets: <AnimatedCounter target={50} suffix="+" />
              </span>
            </li>

            <li className="flex items-center space-x-3 rtl:space-x-reverse">
              <svg
                className="shrink-0 w-3.5 h-3.5 text-green-500 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 16 12"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5.917 5.724 10.5 15 1.5"
                />
              </svg>
              <span>
                Alumni: <AnimatedCounter target={150} suffix="+" />
              </span>
            </li>
          </ul>
        </div>

        <br />
        <br />

        {/* <Slideshow /> */}
        <Image
          src={image0}
          alt={`Slide`}
          priority
          className="w-full md:w-[70%] lg:w-[50%] object-cover mx-auto"
        />

        <br />
        <br />
        {/* Why this section */}
        <div className="w-full xl:w-[80%] 2xl:w-[70%] mx-auto text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold ">
            <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
              But Why this?
            </span>
          </h1>
          <p className="text-md font-normal text-gray-500 lg:text-xl dark:text-gray-400">
            Let's answer some FAQs.
          </p>
          <br />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              className="bg-white dark:bg-gray-800 w-full lg:w-[330px] rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4">
                <i class="fa-solid fa-file-pdf pb-4 text-5xl text-gray-700 dark:text-gray-300 "></i>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  How will this site be beneficial?
                </h3>
                <div className="text-gray-500 dark:text-gray-400 space-y-2">
                  <p>
                    No more wasting time searching for PDFs or videos. We bring
                    all your essential study materials together in one place to
                    keep you focused and curious.
                  </p>
                  <p>
                    {" "}
                    Explore the{" "}
                    <Link
                      href="/shelf"
                      className="text-blue-600 dark:text-blue-500 hover:underline"
                    >
                      Book Shelf
                    </Link>{" "}
                    for additional resources.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 w-full  lg:w-[330px] rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4">
                <i class="fa-solid fa-file-code pb-4 text-5xl text-gray-700 dark:text-gray-300 "></i>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  How will the Code Library help you?
                </h3>
                <div className="text-gray-500 dark:text-gray-400 space-y-2">
                  <p>
                    It will spark your curiosity to learn something new and
                    inspire the creativity to build something unique that stands
                    out from the crowd.
                  </p>
                  <p>
                    Explore the{" "}
                    <Link
                      href="/codelibrary"
                      className="text-blue-600 dark:text-blue-500 hover:underline"
                    >
                      Code Library
                    </Link>{" "}
                    – where learners debug and grow together.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 w-full  lg:w-[330px] rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4">
                <i class="fa-solid fa-paper-plane pb-4 text-5xl text-gray-700 dark:text-gray-300 "></i>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Want to suggest a feature or ask something?
                </h3>
                <div className="text-gray-500 dark:text-gray-400 space-y-2">
                  <p>
                    Got a feature idea or a question? We’re always here to help.
                    Your feedback helps us improve, so don’t hesitate to reach
                    out anytime!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
