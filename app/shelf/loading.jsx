export default function ShelfLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="container mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-96 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-3xl mx-auto animate-pulse"></div>
        </div>

        {/* Grid Skeleton */}
        <div className="w-full bg-white/75 dark:bg-slate-700 px-4 lg:px-6 py-8 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="mx-auto lg:max-w-[330px] md:max-w-[300px] max-w-[280px] bg-white dark:bg-[#071a26] border border-gray-200 dark:border-gray-800 rounded-lg shadow-md"
              >
                {/* Image Skeleton */}
                <div className="h-[180px] w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse"></div>

                {/* Content Skeleton */}
                <div className="p-5">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4 animate-pulse"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse"></div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
