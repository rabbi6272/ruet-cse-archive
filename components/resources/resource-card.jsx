import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ResourceCardLinks } from "./resource-card-links";

// Server component for static card structure
export function ResourceCard({ id, title, description, image, links }) {
  return (
    <Card className="group overflow-hidden h-[360px] flex flex-col hover:shadow-md transition-shadow duration-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="relative h-36 overflow-hidden">
        <Image
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 290px, (max-width: 1024px) 300px, 330px"
          placeholder="blur"
          priority={id <= 2} // Prioritize loading for first 2 cards
        />
      </div>
      <CardContent className="p-3 flex-1 flex flex-col justify-between">
        <div className="flex-1 mb-3">
          <h3 className="mb-2 text-base font-medium text-foreground line-clamp-2 leading-snug">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {description}
          </p>
        </div>
        <ResourceCardLinks links={links} />
      </CardContent>
    </Card>
  );
}
