import Link from "next/link";
import Image, { StaticImageData } from "next/image";

import rabbi from "@/public/images/developers/rabbi2.jpg";
import { lato, nunito } from "@/app/fonts";
import { memo } from "react";

interface ProfileCardProps {
  name: string;
  location?: string;
  image?: StaticImageData;
  github?: string;
  linkedin?: string;
  facebook?: string;
  mail?: string;
}

export const ProfileCard = memo(({ name = "Fazle Rabbi", image = rabbi, location = 'Dhaka, Bangladesh', github = '', linkedin = '', facebook = '', mail = '' }: ProfileCardProps) => {

  return (
    <div
      className={`${lato.className} p-3 bg-white w-full h-auto lg:w-[350px] rounded-2xl overflow-hidden shadow-xl hover:shadow-lg`}
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
        <div className="rounded-b-xl absolute bottom-0 left-0 w-full p-3 text-white bg-gradient-to-t from-black via-black/80 to-transparent">
          <h2 className={`${nunito.className} text-lg font-semibold leading-5`}>{name}</h2>
          <p className="text-sm text-gray-400 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg> {location}
          </p>

          {/* Buttons */}
          <div className="mt-2 mb-1 flex justify-between items-center">
            <Link
              href={`mailto:${mail}`}
              target="_blank"
              className="py-2 px-2 lg:px-4 flex items-center justify-center gap-2 rounded-full text-sm font-medium transition bg-white text-black border border-gray-200 "
            >
              <i className="text-lg fa-regular fa-envelope text-black"></i>
              Contact Me
            </Link>

            <Link
              href={facebook || "#"}
              target="_blank"
              className="ml-2 size-10 grid place-items-center bg-white/20 rounded-full transition hover:bg-white/30"
            >
              <i className="text-xl fa-brands fa-facebook text-white"></i>
            </Link>
            <Link
              href={github || "#"}
              target="_blank"
              className="ml-2 size-10 grid place-items-center bg-white/20 rounded-full transition hover:bg-white/30"
            >
              <i className="text-xl fa-brands fa-github text-white"></i>
            </Link>
            <Link
              href={linkedin || "#"}
              target="_blank"
              className="ml-2 size-10 grid place-items-center bg-white/20 rounded-full transition hover:bg-white/30"
            >
              <i className="text-xl fa-brands fa-linkedin text-white"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});
