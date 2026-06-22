import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/logo.png"
              alt="Poké-Trade"
              width={200}
              height={60}
              className="h-14 w-auto"
              priority
            />
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
