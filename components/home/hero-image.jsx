import Image from "next/image";
import image0 from "@/public/images/slideshow/image0.jpg";

export function HeroImage() {
  return (
    <div className="pt-12 xl:pt-30 w-full md:w-[80%] lg:w-[70%] xl:w-[70%] px-4 lg:px-0 mx-auto">
      <Image
        src={image0}
        alt="hero-image"
        className="hero-image rounded-xl object-cover h-auto animate-scale-up delay-[2000]"
      />
    </div>
  );
}

// "use client";
// import { motion } from "framer-motion";

{
  /* <motion.img
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 3 }}
        viewport={{ once: true, margin: "50px" }}
        src={"/images/slideshow/image0.jpg"}
        alt={`Slide`}
      /> */
}
