import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ShelfCardLinks } from "./shelf-card-links";

// Server component for static book card structure
export function ShelfCard({ id, title, image, links }) {
  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="relative h-40 overflow-hidden">
        <Image
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          src={image}
          alt={`${title} book cover`}
          fill
          sizes="(max-width: 768px) 280px, (max-width: 1024px) 300px, 330px"
          placeholder="blur"
          priority={id <= 2} // Prioritize loading for first 2 cards
        />
      </div>
      <CardContent className="p-3">
        <h3 className="mb-3 text-base font-medium text-foreground line-clamp-2 leading-snug">
          {title}
        </h3>
        <ShelfCardLinks links={links} />
      </CardContent>
    </Card>
  );
}
