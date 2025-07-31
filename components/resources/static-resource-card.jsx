import Image from "next/image";
import Link from "next/link";

// Fully static server component for maximum performance
export function StaticResourceCard({ id, title, description, image, links }) {
  return (
    <div className="resource-card mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-900 rounded-lg shadow-md">
      <Image
        className="rounded-t-lg w-full h-48 object-cover"
        src={image}
        alt={title}
        sizes="(max-width: 768px) 270px, (max-width: 1024px) 300px, 330px"
        placeholder="blur"
        priority={id <= 2}
      />
      <div className="p-5">
        <h5 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-200">
          {title}
        </h5>
        <p className="mb-4 font-normal text-gray-700 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
        <div className="flex gap-3">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.url || "#"}
              className={`w-full rounded px-4 py-2 text-center font-semibold transition-all duration-200 ${
                link.url !== ""
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-600 text-gray-200 cursor-not-allowed opacity-75"
              }`}
              aria-label={`${link.label} ${
                link.url === "" ? "(coming soon)" : ""
              }`}
              {...(link.url === "" && {
                "aria-disabled": "true",
                onClick: (e) => e.preventDefault(),
              })}
            >
              {link.label}
              {link.url === "" && (
                <span className="ml-1 text-xs opacity-75">(Soon)</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
