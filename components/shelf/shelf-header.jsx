import { IBM_Plex_Sans } from 'next/font/google'

const ibmPlex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '600', '700'] })

// Server component for static header
export function ShelfHeader() {
  return (
    <div className={`text-center mb-8 ${ibmPlex.className}`}>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-nowrap">
        <span className="text-transparent bg-clip-text bg-gradient-to-r to-gray-700 from-gray-500 dark:to-neutral-400 dark:from-neutral-200">
          Digital Book Shelf
        </span>
      </h1>
      <p className="text-base font-normal text-gray-500 lg:text-xl dark:text-gray-400 max-w-3xl mx-auto">
        Browse our comprehensive collection of academic textbooks, reference
        materials, and study resources for Computer Science & Engineering
        students at RUET.
      </p>
    </div>
  );
}
