import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlobalCTA } from "@/components/GlobalCTA";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24">{children}</main>
      <Footer />
      <GlobalCTA />
    </>
  );
}
