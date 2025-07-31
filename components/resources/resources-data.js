import image0 from "@/public/images/resources/image0.jpg";
import image1 from "@/public/images/resources/image1.jpg";
import image2 from "@/public/images/resources/image2.jpg";
import image3 from "@/public/images/resources/image3.jpg";
import image4 from "@/public/images/resources/image4.jpg";

export const resourcesData = [
  {
    id: 1,
    title: "1st Year Resources",
    description:
      "Just entered the matrix? Here's your starter pack: C programming, logic gates, and enough math to question your existence. Escape infinite loops early!",
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
      "You've compiled your basics — now get ready for bugs that don't show errors! Dive into 'why won't this code run?!' energy.",
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
      "You're almost out! But wait — there's ML models, thesis panic, final year projects, and last-minute internship hunts. Now's the time to pretend you know everything.",
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
      "Want to escape the 9-to-5 matrix? Whether it's GRE stress or internship ghosting — we got the hacks. Also, don't forget to update your LinkedIn.",
    image: image4,
    links: [{ label: "Read more", url: "" }],
  },
];

// SEO-friendly metadata
export const resourcesMetadata = {
  title: "Academic Resources || RUET CSE Archive",
  description:
    "Access comprehensive study materials, course resources, and academic guides for all years of your CSE journey at RUET.",
  keywords: [
    "RUET",
    "CSE",
    "academic resources",
    "study materials",
    "computer science",
    "engineering",
  ],
};
