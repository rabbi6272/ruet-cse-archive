// Server-side loading skeleton for resources
export default function Loading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="text-center mb-8 animate-pulse">
          <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg mb-4 w-3/4 mx-auto"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-lg mb-2 w-1/2 mx-auto"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-lg w-2/3 mx-auto"></div>
        </div>

        {/* Grid skeleton */}
        <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 lg:px-6 py-8 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[270px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-900 rounded-lg shadow-md animate-pulse"
              >
                <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-t-lg"></div>
                <div className="p-5">
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-lg mb-4 w-3/4"></div>
                  <div className="flex gap-3">
                    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
