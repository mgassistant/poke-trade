export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse mx-auto" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-red-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
