import { ShelfCard } from "./shelf-card";
import { shelfData } from "./shelf-data";

// Fully server-side rendered grid with CSS animations
export function ShelfGrid() {
  return (
    <div className="w-full bg-white dark:bg-slate-700 px-4 lg:px-6 py-8 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-fade-in">
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
