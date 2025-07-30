"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProfileCard } from "@/components/developers/profileCard";
import { isAuthorizedReviewer, getCurrentUser } from "@/lib/auth-utils";

import { avengero, lato, avegance } from "@/app/ui/fonts";

import rabbi2 from "@/public/images/developers/rabbi2.jpg";
import bitto2 from "@/public/images/developers/bitto2.jpg";
import sumon from "@/public/images/developers/sumon.jpg";
import nilay from "@/public/images/developers/nilay.jpg";
import amio from "@/public/images/developers/amio.jpg";
import sujoy from "@/public/images/developers/sujoy.jpg";
import rahi from "@/public/images/developers/rahi.jpg";
import miraj from "@/public/images/developers/miraj.jpg";
import def from "@/public/images/developers/default.jpg";
import ahnaf from "@/public/images/developers/ahnaf.jpg";
import shadman from "@/public/images/developers/shadman.jpg";
// import nahid from "@/public/images/developers/nahid.jpg";
import aqm from "@/public/images/developers/aqm.jpg";
import ratul from "@/public/images/developers/ratul.jpg";
import seam from "@/public/images/developers/seam.jpg";
import mustaq from "@/public/images/developers/mustaq.jpg";

import arnob from "@/public/images/developers/arnob.jpg";

const developers = [
  {
    name: "Md. Fazle Rabbi",
    role: "Frontend & Backend, Code Reviewer",
    location: "Khulna, Bangladesh",
    image: rabbi2,
    roll:"2403172",
    github: "https://github.com/rabbi6272",
    linkedin: "https://www.linkedin.com/in/fazle-rabbi-b48a722a2/",
    facebook: "https://www.facebook.com/frabbi6272",
  },
  {
    name: "Bitto Saha",
    role: "Frontend & Backend, Code Reviewer",
    image: bitto2,
    roll:"2403142",
    location: "Bogura, Bangladesh",
    github: "https://github.com/idcnys/",
    linkedin: "https://www.linkedin.com/in/bittosaha/",
    facebook: "https://www.facebook.com/biiitto",
  },
  {
    name: "Morchhalin Alam Amio",
    role: "Security & Tester",
    image: amio,
    roll:"2403154",
    location: "Kurigram, Bangladesh",
    github: "https://github.com/Amio75",
    linkedin: "https://www.linkedin.com/in/morchhalin-alam-amio-bb35a8360",
    facebook: "https://www.facebook.com/share/1FP1VwSFvd/",
  },
   {
     name: "Sumon Majumder",
     role: "Code Reviewer & Tester",
     image: sumon,
     roll:"2403129",
     location: "Khulna, Bangladesh",
     github: "https://github.com/spiderNerd007",
     linkedin: "https://www.linkedin.com/in/sumon-majumder-6a6b81371",
     facebook: "https://www.facebook.com/share/1Gc3FqZf1L/",
   },
  // {
  //   name: "Sujoy Roy",
  //   role: "Media Team",
  //   image: sujoy,
  //   location: "Barishal, Bangladesh",
  //   github: "#",
  //   linkedin: "https://www.linkedin.com/in/sujoy-roy-855738216",
  //   facebook: "https://www.facebook.com/share/1JopP1ruvs/",
  // },
  // {
  //   name: "Eftekhar Hasnat Rahi",
  //   role: "Media Team",
  //   image: rahi,
  //   location: "Dinajpur, Bangladesh",
  //   github: "https://github.com/RAHI-568",
  //   linkedin: "#",
  //   facebook: "https://www.facebook.com/eftekharhasnat.rahi.568",
  // },
  {
    name: "Nilay Paul Partha",
    role: "Code Reviewer & Tester",
    image: nilay,
    roll:"2403160",
    location: "Cox's Bazar, Bangladesh",
    github: "https://github.com/nilaypaulpartha",
    linkedin: "https://bd.linkedin.com/in/nilay-paul-partho-064654259",
    facebook: "https://www.facebook.com/nilay.paul.2006",
  },
  {
    name: "Mirajul Islam",
    role: "Code Reviewer & Tester",
    image: miraj,
    roll:"2403147",
    location: "Kushtia, Bangladesh",
    github: "#",
    linkedin: "https://www.linkedin.com/in/md-mirajul-islam-98071624b/",
    facebook: "https://www.facebook.com/mirajul.islam.470234/",
  },
  {
    name: "Tasaouf Ahnaf",
    role: "Code Reviewer & Tester",
    image: ahnaf,
    roll:"2403140",
    location: "Jessore, Bangladesh",
    github: "#",
    linkedin: "https://www.linkedin.com/in/tasaoufahnaf/",
    facebook: "https://www.facebook.com/tasaouf.ahnaf",
  },
  {
    name: "Shadman Ahmed",
    role: "Code Reviewer & Tester",
    image: shadman,
    roll:"2403127",
    location: "Bogura, Bangladesh",
    github: "https://github.com/Shadman234-sa",
    linkedin: "https://www.linkedin.com/in/shadman-ahmed-04688b210",
    facebook: "https://www.facebook.com/share/1BrJK4hiuJ/",
  },
  // {
  //   name: "Md. Khushbo Nahid",
  //   role: "Code Reviewer & Tester",
  //   image: def,
  //   location: "Dhaka, Bangladesh",
  //   github: "https://github.com/KN2004",
  //   linkedin: "https://www.linkedin.com/in/khushbo-nahid-0067a136a/",
  //   facebook: "https://www.facebook.com/mkhushbonahid",
  // },
  {
    name: "Arnob Benedict Tudu",
    role: "Code Reviewer & Tester",
    image: arnob,
    roll:"2403155",
    location: "Rajshahi, Bangladesh",
    github: "https://github.com/Arnob001607",
    linkedin: "https://www.linkedin.com/in/arnob-b-tudu-616045360",
    facebook: "https://www.facebook.com/share/1aG3Qw34AL/",
  },
  // {
  //   name: "A Q M Mahadi Haque",
  //   role: "Suggestions & Resource Management",
  //   image: aqm,
  //   location: "Dhaka, Bangladesh",
  //   github: "#",
  //   linkedin: "#",
  //   facebook: "https://www.facebook.com/rehanhaque2k5",
  // },
  {
    name: "Arefin Noused Ratul",
    role: "Suggestions & Resource Management",
    image: ratul,
    roll:"2403149",
    location: "Dhaka, Bangladesh",
    github: "https://github.com/Arefin-Ratul",
    linkedin: "https://www.linkedin.com/in/arefin-noused-ratul-622692366",
    facebook: "https://www.facebook.com/arefin.ratul.18",
  },
  // {
  //   name: "Shahriar Seam",
  //   role: "Suggestions & Resource Management",
  //   image: seam,
  //   location: "Dhaka, Bangladesh",
  //   github: "https://github.com/salterynn",
  //   linkedin: "#",
  //   facebook: "https://www.facebook.com/shahriar.abdullah.1422",
  // },
  // {
  //   name: "Shariar Mustaq",
  //   role: "Suggestions & Resource Management",
  //   image: mustaq,
  //   location: "Rajshahi, Bangladesh",
  //   github: "#",
  //   linkedin: "#",
  //   facebook: "https://www.facebook.com/shahriarmustaqq",
  // },
];

// Group developers by role category
const groupedDevelopers = {
  "Frontend & Backend Developers": developers.filter(
    (dev) => dev.role.includes("Frontend") || dev.role.includes("Backend")
  ),
  Security: developers.filter((dev) => dev.role.includes("Security")),
  "Media Team": developers.filter((dev) => dev.role.includes("Media")),
  "Code Reviewers & Testers": developers.filter(
    (dev) =>
      dev.role.includes("Code Reviewer") ||
      (dev.role.includes("Tester") && !dev.role.includes("Security"))
  ),
  "Idea & Resource Management": developers.filter(
    (dev) => dev.role.includes("Idea") || dev.role.includes("Resource")
  ),
};

export default function Developers() {
  const [user, setUser] = useState(null);
  const [isCodeReviewer, setIsCodeReviewer] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsCodeReviewer(isAuthorizedReviewer(currentUser));
    }
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="p-3 md:p-6 w-full bg-[#ffffffa4] dark:bg-slate-700 rounded-lg">
        <h3
          className={
            avegance.className +
            " pt-1 tracking-wide text-center text-4xl lg:text-6xl font-normal text-gray-800 dark:text-gray-200"
          }
        >
          The Avengers
        </h3>
        <br />

        {/* Code Reviewer Access Button */}
        {isCodeReviewer && (
          <div className="mb-8 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 inline-block shadow-lg">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-3 mr-3">
                  <i className="fas fa-code text-blue-600 dark:text-blue-300 text-xl"></i>
                </div>
                <h4 className="text-xl font-bold text-blue-800 dark:text-blue-200">
                  Code Reviewer Dashboard
                </h4>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-300 mb-4 max-w-md">
                Welcome back, <strong>{user?.name}</strong>! Help coders/programmers by resolving their coding doubts and contributing to the community.
              </p>
              <Link
                href="/reviewers/dashboard"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <i className="fas fa-clipboard-check mr-2"></i>
                Resolve Doubts
                <i className="fas fa-arrow-right ml-2"></i>
              </Link>
              <div className="mt-3 text-xs text-blue-500 dark:text-blue-400">
                View and solve pending coder doubts
              </div>
            </div>
          </div>
        )}

        {/* Frontend & Backend Developers Section */}
        <div className="mb-12 ">
          <h4
            className={
              " tracking-wide border-l-4 border-gray-500 dark:border-gray-300 pl-6 p-2 bg-gray-200 dark:bg-slate-600 text-lg lg:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-4 lg:mb-6"
            }
          >
            Developers
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedDevelopers["Frontend & Backend Developers"].map(
              (developer) => (
                <ProfileCard key={developer.name} {...developer} />
              )
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="mb-12 ">
          <h4
            className={
              " tracking-wide border-l-4 border-gray-500 dark:border-gray-300 pl-6 p-2 bg-gray-200 dark:bg-slate-600 text-lg lg:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-4 lg:mb-6"
            }
          >
            Security
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedDevelopers["Security"].map((developer) => (
              <ProfileCard key={developer.name} {...developer} />
            ))}
          </div>
        </div>

        {/* Media Team Section */}
        {/* <div className="mb-12 ">
          <h4
            className={
              " tracking-wide border-l-4 border-gray-500 dark:border-gray-300 pl-6 p-2 bg-gray-200 dark:bg-slate-600 text-lg lg:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-4 lg:mb-6"
            }
          >
            Media Team
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedDevelopers["Media Team"].map((developer) => (
              <ProfileCard key={developer.name} {...developer} />
            ))}
          </div>
        </div> */}

        {/* Code Reviewers & Testers Section */}
        <div className="mb-12 ">
          <h4
            className={
              " tracking-wide border-l-4 border-gray-500 dark:border-gray-300 pl-6 p-2 bg-gray-200 dark:bg-slate-600 text-lg lg:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-4 lg:mb-6"
            }
          >
            Code Reviewers & Testers
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedDevelopers["Code Reviewers & Testers"].map((developer) => (
              <ProfileCard key={developer.name} {...developer} />
            ))}
          </div>
        </div>

        {/* Suggestions & Resources Management Section */}
        {/* <div className="mb-12 ">
          <p
            className={
              " tracking-wide border-l-4 border-gray-500 dark:border-gray-300 pl-6 p-2 bg-gray-200 dark:bg-slate-600 text-lg lg:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-4 lg:mb-6"
            }
          >
            Suggestions & Resources Management
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedDevelopers["Idea & Resource Management"].map(
              (developer) => (
                <ProfileCard key={developer.name} {...developer} />
              )
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}
