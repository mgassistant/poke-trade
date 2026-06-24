export default function MarketingLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-white via-gray-50 to-red-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-3 space-y-6">
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-3">
                <div className="h-14 w-96 bg-gray-200 rounded animate-pulse" />
                <div className="h-14 w-64 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-80 bg-gray-100 rounded animate-pulse" />
              <div className="flex gap-4 mt-8">
                <div className="h-12 w-40 bg-red-200 rounded-lg animate-pulse" />
                <div className="h-12 w-44 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-[2.5/3.5] bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
