import { AnimatedCounter } from "./animated-counter";

// Server component for static content
export function FeaturesList() {
  return (
    <div className="w-full mx-auto my-8 flex flex-col items-center">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2">
        <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
          Key Features
        </span>
      </h1>
      <ul className="space-y-4 text-center text-gray-500 dark:text-gray-400">
        <li className="flex items-center space-x-3 rtl:space-x-reverse">
          <CheckIcon />
          <span>Access all materials from one place</span>
        </li>

        <li className="flex items-center space-x-3 rtl:space-x-reverse">
          <CheckIcon />
          <span>Code Library to showcase your creativity</span>
        </li>

        <li className="flex items-center space-x-3 rtl:space-x-reverse">
          <CheckIcon />
          <span>
            Available PDF files:{" "}
            <AnimatedCounter target={25} suffix="+" duration={4000} />
          </span>
        </li>

        <li className="flex items-center space-x-3 rtl:space-x-reverse">
          <CheckIcon />
          <span>
            Code snippets:{" "}
            <AnimatedCounter target={50} suffix="+" duration={4000} />
          </span>
        </li>

        <li className="flex items-center space-x-3 rtl:space-x-reverse">
          <CheckIcon />
          <span>
            Alumni: <AnimatedCounter target={150} suffix="+" duration={4000} />
          </span>
        </li>
      </ul>
    </div>
  );
}

// Extracted SVG as server component
function CheckIcon() {
  return (
    <svg
      className="shrink-0 w-3.5 h-3.5 text-green-500 dark:text-green-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 16 12"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M1 5.917 5.724 10.5 15 1.5"
      />
    </svg>
  );
}
