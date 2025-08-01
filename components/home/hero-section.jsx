// Server component for static content
export function HeroSection() {
  return (
    <div className="hero-section w-full lg:max-w-4xl px-2 flex flex-col items-center mx-auto text-center">
      <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl font-extrabold">
        <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
          Welcome to RUET CSE Archive!
        </span>
      </h1>
      <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
        Here we share study materials and essential resources provided by our
        humble seniors, along with guidelines for future studies and job
        sectors.
      </p>
    </div>
  );
}
