export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    </div>
  );
}
