import { SellerProfileClient } from "./SellerProfileClient";

interface SellerPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: SellerPageProps) {
  const { username } = await params;
  return {
    title: `${username}'s Shop — Poké-Trade`,
    description: `Browse cards for sale from ${username} on Poké-Trade.`,
  };
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { username } = await params;
  return <SellerProfileClient username={username} />;
}
