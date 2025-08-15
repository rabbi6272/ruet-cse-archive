import { ResourceCard } from "./resource-card-optimized";
import { resourcesData } from "@/components/resources/resources-data";

// Fully server-side rendered grid with CSS animations
export function ResourcesGridOptimized() {
  return (
    <div className="w-full px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 animate-fade-in">
        {resourcesData.map((item, index) => (
          <div
            key={item.id}
            className="opacity-0 animate-slide-up"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: "forwards",
            }}
          >
            <ResourceCard
              id={item.id}
              title={item.title}
              description={item.description}
              image={item.image}
              links={item.links}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
