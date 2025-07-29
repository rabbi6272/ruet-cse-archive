"use client";
import { motion } from "framer-motion";
import Image from "next/image";

import Link from "next/link";

import toast from "react-hot-toast";

import image0 from "@/public/images/resources/image0.jpg";
import image1 from "@/public/images/resources/image1.jpg";
import image2 from "@/public/images/resources/image2.jpg";
import image3 from "@/public/images/resources/image3.jpg";
import image4 from "@/public/images/resources/image4.jpg";

const data = [
  {
    id: 1,
    title: "1st Year Resources",
    description:
      "Just entered the matrix? Here’s your starter pack: C programming, logic gates, and enough math to question your existence. Escape infinite loops early!",
    image: image0,
    links: [
      {
        label: "1 - 1",
        url: "/drive/1xbyCdj3XQ9AsCCF8ImI13HCo25JEhgUJ",
      },
      { label: "1 - 2", url: "" },
    ],
  },
  {
    id: 2,
    title: "2nd Year Resources",
    description:
      "You’ve compiled your basics — now get ready for bugs that don’t show errors! Dive into 'why won’t this code run?!' energy.",
    image: image1,
    links: [
      { label: "2 - 1", url: "" },
      { label: "2 - 2", url: "" },
    ],
  },
  {
    id: 3,
    title: "3rd Year Resources",
    description:
      "Code is life now. OS deadlocks, Git merge conflicts, and your first real project where 'it works on my machine' is a valid excuse. Enjoy the chaos!",
    image: image2,
    links: [
      { label: "3 - 1", url: "" },
      { label: "3 - 2", url: "" },
    ],
  },
  {
    id: 4,
    title: "4th Year Resources",
    description:
      "You’re almost out! But wait — there’s ML models, thesis panic, final year projects, and last-minute internship hunts. Now’s the time to pretend you know everything.",
    image: image3,
    links: [
      { label: "4 - 1", url: "" },
      { label: "4 - 2", url: "" },
    ],
  },
  {
    id: 5,
    title: "Higher Studies & Internship Details",
    description:
      "Want to escape the 9-to-5 matrix? Whether it's GRE stress or internship ghosting — we got the hacks. Also, don’t forget to update your LinkedIn.",
    image: image4,
    links: [{ label: "Read more", url: "" }],
  },
];

export function ResourcesCardGrid() {
  return (
    <div className="w-full bg-[#ffffff78] dark:bg-slate-700 px-4 lg:px-6 py-8 rounded-lg shadow">
      <h1 className="text-center font-bold leading-none tracking-tight text-gray-800 dark:text-gray-200 text-4xl lg:text-5xl ">
        Useful Resources
      </h1>
      <br />
      <br />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {data.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: item.id * 0.1 }}
            viewport={{ once: true }}
            className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-900 rounded-lg shadow-md "
          >
            <Image className="rounded-t-lg" src={item.image} alt={item.title} />
            <div className="p-5">
              <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
                {item.title}
              </h5>
              <p className="mb-2 font-normal text-gray-700 dark:text-gray-400">
                {item.description}
              </p>
              <div className="flex gap-3 ">
                {item.links.map((link, index) => (
                  <Link
                    key={index}
                    href={link.url}
                    className={`w-full rounded ${
                      link.url !== ""
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-700 hover:bg-gray-800"
                    } text-center font-semibold text-gray-200 p-1`}
                    onClick={() => {
                      if (link.url === "") {
                        toast.error("Link not ready yet!");
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

{
  /* <div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ">
  <Image className="rounded-t-lg" src={image1} alt="image0" />
  <div className="p-5">
    <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
      2<sup>nd</sup> Year Resources
    </h5>
    <p className="mb-2 font-normal text-gray-700 dark:text-gray-400">
      You’ve compiled your basics — now get ready for bugs that don’t show errors! Dive into "why won’t this code run?!" energy.
    </p>
    <div className="flex gap-3 ">
      <Link
        href={""}
        onClick={() => alert("Link not ready yet!")}
        className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
      >
        {" "}
        2 - 1
      </Link>
      <Link
        href={""}
        onClick={() => alert("Link not ready yet!")}
        className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
      >
        {" "}
        2 - 2
      </Link>
    </div>
  </div>
</div>

<div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ">
  <Image className="rounded-t-lg" src={image2} alt="image0" />
  <div className="p-5">
    <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
      3<sup>rd</sup> Year Resources
    </h5>
    <p className="mb-2 font-normal text-gray-700 dark:text-gray-400">
      Code is life now. OS deadlocks, Git merge conflicts, and your first real project where “it works on my machine” is a valid excuse. Enjoy the chaos!
    </p>
    <div className="flex gap-3 ">
      <Link
        href={""}
        onClick={() => alert("Link not ready yet!")}
        className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
      >
        {" "}
        3 - 1
      </Link>
      <Link
        href={""}
        onClick={() => alert("Link not ready yet!")}
        className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
      >
        {" "}
        3 - 2
      </Link>
    </div>
  </div>
</div>

<div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ">
  <Image className="rounded-t-lg" src={image3} alt="image0" />
  <div className="p-5">
    <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
      4<sup>th</sup> Year Resources
    </h5>
    <p className="mb-2 font-normal text-gray-700 dark:text-gray-400">
      You’re almost out! But wait — there’s ML models, thesis panic, final year projects, and last-minute internship hunts. Now’s the time to pretend you know everything.
    </p>
    <div className="flex gap-3 ">
      <Link
        href={""}
        onClick={() => alert("Link not ready yet!")}
        className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
      >
        {" "}
        4 - 1
      </Link>
      <Link
        href={""}
        onClick={() => alert("Link not ready yet!")}
        className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
      >
        {" "}
        4 - 2
      </Link>
    </div>
  </div>
</div>

<div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ">
  <Link href="#">
    <img className="rounded-t-lg" src="/images/image4.jpg" alt="" />
  </Link>
  <div className="p-5">
    <Link href="#">
      <h5 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
        Higer Studies & Internship Deatils
      </h5>
      <p className="mb-2 font-normal text-gray-700 dark:text-gray-400">
        Want to escape the 9-to-5 matrix? Whether it's GRE stress or internship ghosting — we got the hacks. Also, don’t forget to update your LinkedIn
     </p>
    </Link>

    <Link
      href="#"
      className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none"
    >
      Read more
      <svg
        className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 14 10"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M1 5h12m0 0L9 1m4 4L9 9"
        />
      </svg>
    </Link>
  </div>
</div> */
}
