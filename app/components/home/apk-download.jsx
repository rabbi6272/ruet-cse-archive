import Image from "next/image";
import Link from "next/link";

export function ApkDownload() {
  return (
    <section
      aria-labelledby="apk-heading"
      className="w-full px-6 sm:px-8 py-8 sm:py-14"
    >
      <div className="reveal max-w-5xl mx-auto rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#071a26] px-6 sm:px-10 py-8 flex flex-col md:flex-row items-center md:justify-between gap-8 hover:shadow-md hover:border-blue-600/50 transition-all duration-300">
        {/* App info */}
        <div className="md:hidden flex flex-col items-center gap-5 w-full md:w-auto justify-center md:justify-start">
          <div className="flex items-center">
            <Image
              width={64}
              height={64}
              src="/images/semicolon.png"
              alt="Semicolon app icon"
              className="w-16 h-16 object-contain"
            />
            <h2
              id="apk-heading"
              className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              Take the archive with you
            </h2>
          </div>
          <p className=" text-gray-600 dark:text-gray-400">
            Semicolon, our companion app, brings a faster, optimized in-app
            experience to the same resources.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-5 w-full md:w-auto justify-center md:justify-start">
          <Image
            width={80}
            height={80}
            src="/images/semicolon.png"
            alt="Semicolon app icon"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain"
          />
          <div>
            <h2
              id="apk-heading"
              className="font-[family-name:var(--font-space-grotesk)] text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100"
            >
              Take the archive with you
            </h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400 max-w-md">
              Semicolon, our companion app, brings a faster, optimized in-app
              experience to the same resources.
            </p>
          </div>
        </div>

        {/* Download button */}
        <Link
          href="https://github.com/idcnys/semicolon/releases/download/apk_latest/semicolon_2.0.3.apk"
          download
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors shrink-0"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Download APK
        </Link>
      </div>
    </section>
  );
}
