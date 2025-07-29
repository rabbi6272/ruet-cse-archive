import Link from "next/link";
import Image from "next/image";

import rabbi from "@/public/images/developers/rabbi2.jpg";
import bitto from "@/public/images/developers/bitto2.jpg";

import { lato } from "../ui/fonts";

const ProfileCard = ({
  name = "Fazle Rabbi",
  title = "I'm a Frontend & Backend Developer who focuses on building responsive web applications.",
  image,
  rating = 4.8,
  earned = "$45k+",
  rate = "$50/hr",
}) => {
  return (
    <div
      className={
        lato.className +
        " p-3  bg-white w-full lg:w-[350px] rounded-2xl overflow-hidden shadow-xl hover:shadow-lg"
      }
    >
      <div className="relative">
        {/* Image Section */}
        <div>
          <Image
            src={image}
            alt={name}
            className="w-full rounded-t-xl rounded-b-xl"
          />
        </div>

        {/* Content Section */}
        <div className="rounded-b-xl absolute bottom-0 left-0 p-3 text-white bg-gradient-to-t from-black via-black/80 to-transparent">
          <h2 className="text-lg font-semibold">{name} </h2>
          <p className="text-sm mt-1">{title}</p>

          {/* Stats Row */}
          {/* <div className="flex justify-between text-center text-sm mt-2">
            <div className="flex flex-col items-center">
              <i className="fa-solid fa-star text-yellow-400 mb-1"></i>
              <span>{rating}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium">{earned}</span>
              <span className="text-xs text-gray-500">Earned</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-medium">{rate}</span>
              <span className="text-xs text-gray-500">Rate</span>
            </div>
          </div> */}

          {/* Buttons */}
          <div className="mt-2 mb-1 flex justify-between items-center">
            <Link
              href={""}
              className="py-2 px-2 lg:px-4 flex items-center justify-center gap-1 rounded-full font-semibold transition bg-white text-black border border-gray-200 "
            >
              <i className="text-lg fa-regular fa-envelope text-black"></i>
              Contact Me
            </Link>

            <Link
              href={""}
              className="ml-2 size-10 grid place-items-center bg-white/20 rounded-full transition hover:bg-white/30"
            >
              <i className="text-xl fa-brands fa-facebook text-white"></i>
            </Link>
            <Link
              href={""}
              className="ml-2 size-10 grid place-items-center bg-white/20 rounded-full transition hover:bg-white/30"
            >
              <i className="text-xl fa-brands fa-github text-white"></i>
            </Link>
            <Link
              href={""}
              className="ml-2 size-10 grid place-items-center bg-white/20 rounded-full transition hover:bg-white/30"
            >
              <i className="text-xl fa-brands fa-linkedin text-white"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Rabbi() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 justify-center items-center min-h-screen p-4 bg-gray-300">
      <ProfileCard name="Fazle Rabbi" image={rabbi} />
      <ProfileCard name="Bitto Saha" image={bitto} />
    </div>
  );
}
