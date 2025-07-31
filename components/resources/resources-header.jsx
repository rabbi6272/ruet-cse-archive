// Server component for static header
export function ResourcesHeader() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
        <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
          Academic Resources
        </span>
      </h1>
      <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400 max-w-3xl mx-auto">
        Access comprehensive study materials, course resources, and academic
        guides for all years of your CSE journey at RUET.
      </p>
    </div>
  );
}
