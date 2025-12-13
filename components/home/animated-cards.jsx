"use client";
import { motion } from "framer-motion";

export function AnimatedCards({ children, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: index * 0.1 }}
      className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md w-full lg:w-[330px] rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      {children}
    </motion.div>
  );
}
