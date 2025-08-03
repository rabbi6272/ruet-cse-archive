import Image from "next/image";
import { ShelfCardLinks } from "./shelf-card-links";

// Server component for static book card structure
export function ShelfCard({ id, title, image, links }) {
  return (
    <div className="book-card mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[280px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <Image
        className="rounded-t-lg w-full h-48 object-cover"
        src={image}
        alt={`${title} book cover`}
        sizes="(max-width: 768px) 280px, (max-width: 1024px) 300px, 330px"
        placeholder="blur"
        priority={id <= 2} // Prioritize loading for first 2 cards
      />
      <div className="p-5">
        <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-gray-200 line-clamp-2">
          {title}
        </h5>
        <ShelfCardLinks links={links} />
      </div>
    </div>
  );
}
