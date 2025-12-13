"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AnimatedCards } from "./animated-cards";

// Client component with parallax effects
export function FAQSection() {
  const cards = [
    {
      icon: "fa-solid fa-file-pdf",
      title: "How will this site be beneficial?",
      content: (
        <>
          <p>
            No more wasting time searching for PDFs or videos. We bring all your
            essential study materials together in one place to keep you focused
            and curious.
          </p>
          <p>
            Explore the{" "}
            <Link
              href="/shelf"
              className="text-blue-600 dark:text-blue-500 hover:underline"
            >
              Book Shelf
            </Link>{" "}
            for additional resources.
          </p>
        </>
      ),
    },
    {
      icon: "fa-solid fa-file-code",
      title: "How will the Code Library help you?",
      content: (
        <>
          <p>
            It will spark your curiosity to learn something new and inspire the
            creativity to build something unique that stands out from the crowd.
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
        </>
      ),
    },
    {
      icon: "fa-solid fa-users",
      title: "Who are we?",
      content: (
        <p>
          We are a group of{" "}
          <Link
            href="/contact/developers"
            className="text-blue-600 dark:text-blue-500 hover:underline"
          >
            RUET CSE students
          </Link>{" "}
          who are passionate about programming and love to help others. We aim
          to create a platform that makes learning easier and more accessible
          for everyone.
        </p>
      ),
    },
    // {
    //   icon: "fa-solid fa-paper-plane",
    //   title: "Want to suggest a feature or ask something?",
    //   content: (
    //     <p>
    //       Got a feature idea or a question? We're always here to help. Your
    //       feedback helps us improve, so don't hesitate to reach out anytime!
    //     </p>
    //   ),
    // },
  ];

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Create parallax transforms for different elements
  const headerY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  const cardsY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const cardsScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.8, 1, 1, 0.9]);

  return (
    <motion.div 
      ref={ref}
      className="w-full px-4 mx-auto text-center relative overflow-hidden"
    >
      {/* Parallax Background Elements */}
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [200, -200]) }}
        className="absolute inset-0 -z-10"
      >
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30"></div>
      </motion.div>

      {/* Parallax Header */}
      <motion.div
        style={{ 
          y: headerY,
          opacity: headerOpacity
        }}
      >
        <motion.h1 
          className="text-2xl md:text-3xl lg:text-4xl font-extrabold"
          initial={{ scale: 0.8 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
            But Why this?
          </span>
        </motion.h1>
        <motion.p 
          className="text-md font-normal text-gray-500 lg:text-xl dark:text-gray-400"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Let's answer some FAQs.
        </motion.p>
      </motion.div>
      <br />

      {/* Parallax Cards Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:px-10 gap-4 mx-auto"
        style={{ 
          y: cardsY,
          scale: cardsScale
        }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 50, rotateX: 15 }}
            whileInView={{ 
              opacity: 1, 
              y: 0, 
              rotateX: 0,
              transition: { 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }
            }}
            whileHover={{ 
              scale: 1.05,
              rotateY: 5,
              transition: { duration: 0.3 }
            }}
            style={{
              y: useTransform(scrollYProgress, [0, 1], [index * 20, -index * 20])
            }}
          >
            <AnimatedCards index={index}>
              <motion.div 
                className="p-4"
                whileHover={{
                  backgroundColor: "rgba(59, 130, 246, 0.05)",
                  transition: { duration: 0.3 }
                }}
              >
                <motion.i
                  className={`${card.icon} pb-4 text-5xl text-gray-700 dark:text-gray-300`}
                  whileHover={{ 
                    scale: 1.2, 
                    rotate: 10,
                    color: "#3B82F6"
                  }}
                  transition={{ duration: 0.3 }}
                ></motion.i>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {card.title}
                </h3>
                <div className="text-gray-500 dark:text-gray-400 space-y-2">
                  {card.content}
                </div>
              </motion.div>
            </AnimatedCards>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
