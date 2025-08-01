"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

import { nunito } from "@/app/ui/fonts";

export function ProfileCard({
  name,
  role,
  image,
  location,
  github,
  linkedin,
  facebook,
  roll,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [pointsData, setPointsData] = useState(null);

  useEffect(() => {
    if (roll) {
      const pointsRef = ref(db, `solverPoints/${roll}`);
      onValue(pointsRef, (snapshot) => {
        const data = snapshot.val();
        setPointsData(data);
      });
    }
  }, [roll]);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className="group mx-auto relative h-[420px] w-[300px] rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Front Side */}
      <div
        className={`absolute inset-0 flex flex-col items-center pt-6 px-4 bg-gradient-to-b from-blue-50 to-white transition-all duration-500 ${
          isFlipped ? "opacity-0" : "opacity-100 group-hover:opacity-0"
        }`}
      >
        <div className="relative h-[180px] w-[180px] rounded-full overflow-hidden border-4 border-white shadow-md">
          <Image src={image} alt={name} fill className="object-cover" />
        </div>
        <h3
          className={`${nunito.className} mt-4 text-xl font-semibold text-gray-800`}
        >
          {name}
        </h3>
        <p className="mt-1 text-gray-600 flex items-center">
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
          </svg>
          {location}
        </p>
        <p className="mt-2 text-sm text-gray-500 text-center">{role}</p>

        {/* Points Display */}
        {/* {pointsData && role.includes("Code Reviewer") && (
          <div className="mt-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium text-yellow-700">Help Points</span>
              </div>
              <div className="text-lg font-bold text-yellow-800">{pointsData.totalPoints?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-yellow-600">{pointsData.doubtsResolved || 0} doubts solved</div>
            </div>
          </div>
        )} */}

        <p className="mt-2 text-xs text-blue-500">Tap/Hover for social links</p>
      </div>

      {/* Back Side - Social Links */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-700 flex flex-col justify-center items-center transition-all duration-500 ${
          isFlipped ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <div className="flex space-x-4" onClick={(e) => e.stopPropagation()}>
          {github !== "#" && (
            <Link
              href={github}
              target="_blank"
              className="text-white hover:text-blue-200 transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </Link>
          )}

          {linkedin !== "#" && (
            <Link
              href={linkedin}
              target="_blank"
              className="text-white hover:text-blue-200 transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </Link>
          )}

          {facebook !== "#" && (
            <Link
              href={facebook}
              target="_blank"
              className="text-white hover:text-blue-200 transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
              </svg>
            </Link>
          )}
        </div>
        <p className="mt-4 text-white text-center px-4">{name}</p>
        <p className="text-blue-200 text-sm mt-1">{role}</p>
      </div>
    </div>
  );
}
