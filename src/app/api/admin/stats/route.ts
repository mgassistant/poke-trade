import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    usersRes,
    newUsersRes,
    cardsRes,
    tradesRes,
    activeTradesRes,
    completedTradesRes,
    disputedTradesRes,
    listingsRes,
    activeListingsRes,
    soldListingsRes,
    ordersRes,
    revenueRes,
    dropAlertsRes,
    activityRes,
    reportsRes,
    disputesRes,
  ] = await Promise.all([
    svc.from("profiles").select("*", { count: "exact", head: true }),
    svc.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    svc.from("cards").select("*", { count: "exact", head: true }),
    svc.from("trade_offers").select("*", { count: "exact", head: true }),
    svc.from("trade_offers").select("*", { count: "exact", head: true }).in("status", ["pending", "accepted"]),
    svc.from("trade_offers").select("*", { count: "exact", head: true }).eq("status", "completed"),
    svc.from("trade_offers").select("*", { count: "exact", head: true }).eq("status", "declined"),
    svc.from("listings").select("*", { count: "exact", head: true }),
    svc.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    svc.from("listings").select("*", { count: "exact", head: true }).eq("status", "sold"),
    svc.from("orders").select("*", { count: "exact", head: true }),
    svc.from("orders").select("amount").eq("status", "completed"),
    svc.from("drop_alerts").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    svc.from("activity_feed").select("id, user_id, activity_type, data, created_at").order("created_at", { ascending: false }).limit(20),
    svc.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    svc.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const revenue = (revenueRes.data || []).reduce((sum: number, o: any) => sum + (parseFloat(o.amount) || 0), 0);

  return NextResponse.json({
    stats: {
      totalUsers: usersRes.count || 0,
      newUsers: newUsersRes.count || 0,
      totalCards: cardsRes.count || 0,
      totalTrades: tradesRes.count || 0,
      activeTrades: activeTradesRes.count || 0,
      completedTrades: completedTradesRes.count || 0,
      disputedTrades: disputedTradesRes.count || 0,
      totalListings: listingsRes.count || 0,
      activeListings: activeListingsRes.count || 0,
      soldListings: soldListingsRes.count || 0,
      totalOrders: ordersRes.count || 0,
      revenue,
      activeDropAlerts: dropAlertsRes.count || 0,
      pendingReports: reportsRes.count || 0,
      openDisputes: disputesRes.count || 0,
    },
    activity: activityRes.data || [],
  });
}
