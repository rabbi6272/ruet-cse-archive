"use client";

import { motion } from "framer-motion";

// import Image from "next/image";
// import image0 from "@/public/images/slideshow/image0.jpg";
// className="w-full md:w-[80%] lg:w-[70%] xl:w-[60%] px-4 object-cover mx-auto rounded-2xl"

export function HeroImage() {
  return (
    <div className="pt-12 xl:pt-30 w-full md:w-[80%] lg:w-[70%] xl:w-[60%] px-4 object-cover mx-auto rounded-2xl">
      <motion.img
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 3 }}
        src={"/images/slideshow/image0.jpg"}
        alt={`Slide`}
      />
    </div>
  );
}
