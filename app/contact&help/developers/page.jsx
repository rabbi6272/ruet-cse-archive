import { ProfileCard } from "@/components/contact&help/developers/profileCard";

import { avegance } from "@/app/ui/fonts";

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
import aqm from "@/public/images/developers/aqm.jpg";
import ratul from "@/public/images/developers/ratul.jpg";
import seam from "@/public/images/developers/seam.jpg";
import mustaq from "@/public/images/developers/mustaq.jpg";
import arnob from "@/public/images/developers/arnob.jpg";

import { groupDevelopersByRole } from "@/lib/developer-utils";

const staticDevelopers = [
  {
    name: "Md. Fazle Rabbi",
    role: "Frontend & Backend, Code Reviewer",
    location: "Khulna, Bangladesh",
    image: rabbi2,
    roll: "2403172",
    github: "https://github.com/rabbi6272",
    linkedin: "https://www.linkedin.com/in/fazle-rabbi-b48a722a2/",
    facebook: "https://www.facebook.com/frabbi6272",
  },
  {
    name: "Bitto Saha",
    role: "Frontend & Backend, Code Reviewer",
    image: bitto2,
    roll: "2403142",
    location: "Bogura, Bangladesh",
    github: "https://github.com/idcnys/",
    linkedin: "https://www.linkedin.com/in/bittosaha/",
    facebook: "https://www.facebook.com/biiitto",
  },
  {
    name: "Morchhalin Alam Amio",
    role: "Security & Tester",
    image: amio,
    roll: "2403154",
    location: "Kurigram, Bangladesh",
    github: "https://github.com/Amio75",
    linkedin: "https://www.linkedin.com/in/morchhalin-alam-amio-bb35a8360",
    facebook: "https://www.facebook.com/share/1FP1VwSFvd/",
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
    roll: "2403160",
    location: "Cox's Bazar, Bangladesh",
    github: "https://github.com/nilaypaulpartha",
    linkedin: "https://bd.linkedin.com/in/nilay-paul-partho-064654259",
    facebook: "https://www.facebook.com/nilay.paul.2006",
  },
  {
    name: "Mirajul Islam",
    role: "Code Reviewer & Tester",
    image: miraj,
    roll: "2403147",
    location: "Kushtia, Bangladesh",
    github: "#",
    linkedin: "https://www.linkedin.com/in/md-mirajul-islam-98071624b/",
    facebook: "https://www.facebook.com/mirajul.islam.470234/",
  },
  {
    name: "Tasaouf Ahnaf",
    role: "Code Reviewer & Tester",
    image: ahnaf,
    roll: "2403140",
    location: "Jessore, Bangladesh",
    github: "#",
    linkedin: "https://www.linkedin.com/in/tasaoufahnaf/",
    facebook: "https://www.facebook.com/tasaouf.ahnaf",
  },
  {
    name: "Shadman Ahmed",
    role: "Code Reviewer & Tester",
    image: shadman,
    roll: "2403127",
    location: "Bogura, Bangladesh",
    github: "https://github.com/Shadman234-sa",
    linkedin: "https://www.linkedin.com/in/shadman-ahmed-04688b210",
    facebook: "https://www.facebook.com/share/1BrJK4hiuJ/",
  },
  {
    name: "Arnob Benedict Tudu",
    role: "Code Reviewer & Tester",
    image: arnob,
    roll: "2403155",
    location: "Rajshahi, Bangladesh",
    github: "https://github.com/Arnob001607",
    linkedin: "https://www.linkedin.com/in/arnob-b-tudu-616045360",
    facebook: "https://www.facebook.com/share/1aG3Qw34AL/",
  },
  // {
  //   name: "A Q M Mahadi Haque",
  //   role: "Resource Management",
  //   image: aqm,
  //   location: "Dhaka, Bangladesh",
  //   github: "#",
  //   linkedin: "#",
  //   facebook: "https://www.facebook.com/rehanhaque2k5",
  // },
  {
    name: "Arefin Noused Ratul",
    role: "Resource Management",
    image: ratul,
    roll: "2403149",
    location: "Dhaka, Bangladesh",
    github: "https://github.com/Arefin-Ratul",
    linkedin: "https://www.linkedin.com/in/arefin-noused-ratul-622692366",
    facebook: "https://www.facebook.com/arefin.ratul.18",
  },
  // {
  //   name: "Shahriar Seam",
  //   role: "Resource Management",
  //   image: seam,
  //   location: "Dhaka, Bangladesh",
  //   github: "https://github.com/salterynn",
  //   linkedin: "#",
  //   facebook: "https://www.facebook.com/shahriar.abdullah.1422",
  // },
  // {
  //   name: "Shariar Mustaq",
  //   role: "Resource Management",
  //   image: mustaq,
  //   location: "Rajshahi, Bangladesh",
  //   github: "#",
  //   linkedin: "#",
  //   facebook: "https://www.facebook.com/shahriarmustaqq",
  // },
];

export default function Developers() {
  // groupDevelopersByRole is a utility function that takes an array of developers and groups them by their roles. It returns an object where the keys are the roles and the values are arrays of developers who have that role.
  const groupedDevelopers = groupDevelopersByRole(staticDevelopers);

  return (
    <div className="p-4 md:p-8 min-h-dvh">
      {/* <div className="p-3 md:p-6 w-full bg-[#ffffffa4] dark:bg-slate-700 rounded-lg"> */}
      <h3
        className={
          avegance.className +
          " pt-1 tracking-wide text-center text-4xl lg:text-6xl font-normal text-gray-800 dark:text-gray-200"
        }
      >
        The Avengers
      </h3>
      <br />

      {/* Frontend & Backend Developers Section */}
      {groupedDevelopers["Frontend & Backend Developers"] &&
        groupedDevelopers["Frontend & Backend Developers"].length > 0 && (
          <div className="mb-12 ">
            <h4
              className={
                " tracking-wide border-l-4 border-gray-500 dark:border-gray-300 pl-6 p-2 bg-gray-300 dark:bg-gray-700 rounded-md text-lg lg:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-4 lg:mb-6"
              }
            >
              Developers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 lg:px-6">
              {groupedDevelopers["Frontend & Backend Developers"].map(
                (developer) => (
                  <ProfileCard
                    key={developer.name + (developer.roll || "")}
                    {...developer}
                  />
                ),
              )}
            </div>
          </div>
        )}

      {/* Security Section */}
      {groupedDevelopers["Security"] &&
        groupedDevelopers["Security"].length > 0 && (
          <div className="mb-12 ">
            <h4
              className={
                " tracking-wide border-l-4 border-gray-500 dark:border-gray-300 pl-6 p-2 bg-gray-300 dark:bg-gray-700 rounded-md text-lg lg:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-4 lg:mb-6"
              }
            >
              Security
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 lg:px-6">
              {groupedDevelopers["Security"].map((developer) => (
                <ProfileCard
                  key={developer.name + (developer.roll || "")}
                  {...developer}
                />
              ))}
            </div>
          </div>
        )}

      {/* Code Reviewers & Testers Section */}
      {groupedDevelopers["Code Reviewers & Testers"] &&
        groupedDevelopers["Code Reviewers & Testers"].length > 0 && (
          <div className="mb-12 ">
            <h4
              className={
                " tracking-wide border-l-4 border-gray-500 dark:border-gray-300 pl-6 p-2 bg-gray-300 dark:bg-gray-700 rounded-md text-lg lg:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-4 lg:mb-6"
              }
            >
              Code Reviewers & Testers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 lg:px-6">
              {groupedDevelopers["Code Reviewers & Testers"].map(
                (developer) => (
                  <ProfileCard
                    key={developer.name + (developer.roll || "")}
                    {...developer}
                  />
                ),
              )}
            </div>
          </div>
        )}

      {/* Suggestions & Resources Management Section */}
      {groupedDevelopers["Resource Management"] &&
        groupedDevelopers["Resource Management"].length > 0 && (
          <div className="mb-12 ">
            <h4
              className={
                " tracking-wide border-l-4 border-gray-500 dark:border-gray-300 pl-6 p-2 bg-gray-300 dark:bg-gray-700 rounded-md text-lg lg:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-4 lg:mb-6"
              }
            >
              Resources Management
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 lg:px-6">
              {groupedDevelopers["Resource Management"].map((developer) => (
                <ProfileCard
                  key={developer.name + (developer.roll || "")}
                  {...developer}
                />
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
