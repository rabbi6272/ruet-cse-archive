import Image from "next/image";
import image0 from "@/public/images/slideshow/image0.jpg";

export function HeroImage() {
  return (
    <div className="pt-12 xl:pt-30 w-full px-4 lg:px-0 flex justify-center">
      <Image
        src={image0}
        alt="hero-image"
        className="hero-image w-full md:w-[80%] lg:w-[70%] xl:w-[70%] rounded-xl object-cover h-auto animate-scale-up delay-[2000]"
      />
    </div>
  );
}
