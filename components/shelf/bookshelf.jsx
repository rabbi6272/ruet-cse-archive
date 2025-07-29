"use client";
import { motion } from "framer-motion";

import Image from "next/image";
import Link from "next/link";

import toast from "react-hot-toast";

import image0 from "@/public/images/shelf/image00.jpg";
import image1 from "@/public/images/shelf/image002.jpg";
import image2 from "@/public/images/shelf/image02.jpg";
import image3 from "@/public/images/shelf/image03.jpg";
import image4 from "@/public/images/shelf/image04.jpg";
import image5 from "@/public/images/shelf/image05.jpg";
import image6 from "@/public/images/shelf/image06.jpg";
import image7 from "@/public/images/shelf/image07.jpg";

const data = [
  {
    title: "Physics",
    image: image0,
    driveLink: "",
    youtubeLink: "",
  },
  {
    title: "Maths",
    image: image2,
    driveLink: "/drive/15uaZEhr0Om7cOT_xHnL0d-8HFmyGK6Js",
    youtubeLink: "",
  },
  {
    title: "Chemistry",
    image: image1,
    driveLink: "/drive/1eV35EzY4CCWv4lu5BWYmAOn3vcV0LWiX",
    youtubeLink: "",
  },
  {
    title: "C programming",
    image: image3,
    driveLink: "/drive/1UdOHPrjWU5dx33eO4k6GlbUl2PmQTeeP",
    youtubeLink: "",
  },
  {
    title: "Computer Science",
    image: image7,
    driveLink: "/drive/1hf2cSufrcjLbDZ1Oe1VqjKs3SyN-dNXQ",
    youtubeLink: "",
  },
  {
    title: "Computer Hardware",
    image: image4,
    driveLink: "/drive/1918v26FB2PrPPCczU_GyUX1VQSlFAHMC",
    youtubeLink: "",
  },
  {
    title: "Competitive Programming",
    image: image6,
    driveLink: "/drive/1UfBBUh4mQHwF3RSNe2xuMmiB812yWshW",
    youtubeLink: "",
  },
  {
    title: "English",
    image: image5,
    driveLink: "/drive/1l1j8yHlsWJIhJIFXbqyaz-W2Onw8da1O",
    youtubeLink: "",
  },
];
const imageStyle = {
  height: "180px",
  width: "100%",
  objectFit: "cover",
};

export function BookShelfGrid() {
  return (
    <div className="w-full bg-[#ffffff78] dark:bg-slate-700 px-4 lg:px-6 py-8 rounded-lg shadow">
      <h1 className="text-center font-bold leading-none tracking-tight text-gray-800 dark:text-gray-200 text-4xl lg:text-5xl ">
        Book shelf
      </h1>
      <br />
      <br />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md "
          >
            <div className="h-[180px] w-full">
              <Image
                className="rounded-t-lg"
                style={imageStyle}
                src={item.image}
                alt={item.title}
              />
            </div>
            <div className="p-5">
              <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
                {item.title}
              </h5>

              <div className="flex gap-3 ">
                <Link
                  href={item.driveLink}
                  onClick={() =>
                    item.driveLink ? null : toast.error("Link not ready yet!")
                  }
                  className={`${
                    item.driveLink !== ""
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-700 hover:bg-gray-800"
                  } w-full rounded text-center font-semibold text-gray-200 p-1`}
                >
                  {" "}
                  Drive
                </Link>
                <Link
                  href={item.youtubeLink}
                  onClick={() => toast.error("Link not ready yet!")}
                  className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
                >
                  {" "}
                  Youtube
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
{
  /* Card 1 */
}
{
  /* <div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-900 rounded-lg shadow-md ">
          <Image className="rounded-t-lg" src={image0} alt="image0" />
          <div className="p-5">
            <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
              Physics
            </h5>

            <div className="flex gap-3 ">
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Drive
              </Link>
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Youtube
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2 */
}
{
  /* <div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ">
          <Image className="rounded-t-lg" src={image2} alt="image0" />
          <div className="p-5">
            <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
              Maths
            </h5>

            <div className="flex gap-3 ">
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Drive
              </Link>
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Youtube
              </Link>
            </div>
          </div>
        </div> */
}
{
  /* Card 3 */
}
{
  /* <div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ">
          <Image className="rounded-t-lg" src={image1} alt="image0" />
          <div className="p-5">
            <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
              Chemistry
            </h5>

            <div className="flex gap-3 ">
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Drive
              </Link>
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Youtube
              </Link>
            </div>
          </div>
        </div> */
}
{
  /* Card 4 */
}
{
  /* <div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ">
          <Image className="rounded-t-lg" src={image3} alt="image0" />
          <div className="p-5">
            <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
              C programming
            </h5>

            <div className="flex gap-3 ">
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Drive
              </Link>
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Youtube
              </Link>
            </div>
          </div>
        </div> */
}
{
  /* Card 5 */
}
{
  /* <div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ">
          <Image className="rounded-t-lg" src={image4} alt="image0" />
          <div className="p-5">
            <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
              Computer Hardware
            </h5>

            <div className="flex gap-3 ">
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Drive
              </Link>
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Youtube
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md ">
          <Image className="rounded-t-lg" src={image5} alt="image0" />
          <div className="p-5">
            <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
              English
            </h5>

            <div className="flex gap-3 ">
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Drive
              </Link>
              <Link
                href={""}
                onClick={() => alert("Link not ready yet!")}
                className="w-full rounded bg-gray-700 hover:bg-gray-800 text-center font-semibold text-gray-200 p-1"
              >
                {" "}
                Youtube
              </Link>
            </div>
          </div>
        </div> */
}
