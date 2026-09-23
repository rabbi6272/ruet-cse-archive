
const SKELETON_ROWS = 7;

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="px-2 lg:px-4 py-4 lg:p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="text-lg md:text-xl lg:text-2xl mr-2">
        <div className="drive-skeleton w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded" />
      </div>

      <div className="flex-1">
        <div className="drive-skeleton h-4" style={{ width: `${45 + ((index * 17) % 40)}%` }} />
      </div>

      <div className="drive-skeleton w-10 md:w-12 h-7.5 md:h-9 rounded-full shrink-0" />
    </div>
  );
}

export default function DriveViewSkeleton() {
  return (
    <>
      <br />
      <br />

      <div className="px-4 md:px-0 md:max-w-[90%] lg:max-w-[80%] xl:max-w-[70%] mx-auto">
        <div
          className={`bg-[#ffffff] dark:bg-[#071a26] px-4 lg:px-6 xl:px-8 py-4 md:py-8 rounded-2xl md:rounded-xl shadow-lg`}
        >
          <div className="mx-auto">
            <div className="flex justify-center mb-6">
              <div className="drive-skeleton h-8 w-48 md:w-56" />
            </div>

            <div className="flex flex-col">
              {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                <SkeletonRow key={index} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <br />
      <br />
    </>
  );
}
