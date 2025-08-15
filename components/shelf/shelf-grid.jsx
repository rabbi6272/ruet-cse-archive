import { ShelfCard } from "./shelf-card";

import image0 from "@/public/images/shelf/image00.jpg";
import image1 from "@/public/images/shelf/image002.jpg";
import image2 from "@/public/images/shelf/image02.jpg";
import image3 from "@/public/images/shelf/image03.jpg";
import image4 from "@/public/images/shelf/image04.jpg";
import image5 from "@/public/images/shelf/image05.jpg";
import image6 from "@/public/images/shelf/image06.jpg";
import image7 from "@/public/images/shelf/image07.jpg";

const shelfData = [
  {
    id: 1,
    title: "Physics",
    image: image0,
    links: [
      { label: "Drive", url: "" },
      { label: "YouTube", url: "" },
    ],
  },
  {
    id: 2,
    title: "Maths",
    image: image2,
    links: [
      { label: "Drive", url: "/drive/15uaZEhr0Om7cOT_xHnL0d-8HFmyGK6Js" },
      { label: "YouTube", url: "" },
    ],
  },
  {
    id: 3,
    title: "Chemistry",
    image: image1,
    links: [
      { label: "Drive", url: "/drive/1eV35EzY4CCWv4lu5BWYmAOn3vcV0LWiX" },
      { label: "YouTube", url: "" },
    ],
  },
  {
    id: 4,
    title: "C programming",
    image: image3,
    links: [
      { label: "Drive", url: "/drive/1UdOHPrjWU5dx33eO4k6GlbUl2PmQTeeP" },
      { label: "YouTube", url: "" },
    ],
  },
  {
    id: 5,
    title: "Computer Science",
    image: image7,
    links: [
      { label: "Drive", url: "/drive/1hf2cSufrcjLbDZ1Oe1VqjKs3SyN-dNXQ" },
      { label: "YouTube", url: "" },
    ],
  },
  {
    id: 6,
    title: "Computer Hardware",
    image: image4,
    links: [
      { label: "Drive", url: "/drive/1918v26FB2PrPPCczU_GyUX1VQSlFAHMC" },
      { label: "YouTube", url: "" },
    ],
  },
  {
    id: 7,
    title: "Competitive Programming",
    image: image6,
    links: [
      { label: "Drive", url: "/drive/1UfBBUh4mQHwF3RSNe2xuMmiB812yWshW" },
      { label: "YouTube", url: "" },
    ],
  },
  {
    id: 8,
    title: "English",
    image: image5,
    links: [
      { label: "Drive", url: "/drive/1l1j8yHlsWJIhJIFXbqyaz-W2Onw8da1O" },
      { label: "YouTube", url: "" },
    ],
  },
];

// Fully server-side rendered grid with CSS animations
export function ShelfGrid() {
  return (
    <div className="w-full px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 animate-fade-in">
        {shelfData.map((item, index) => (
          <div
            key={item.id}
            className="opacity-0 animate-slide-up"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: "forwards",
            }}
          >
            <ShelfCard
              id={item.id}
              title={item.title}
              image={item.image}
              links={item.links}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
