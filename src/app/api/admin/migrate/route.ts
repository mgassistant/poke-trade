import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from "@/lib/supabase/server";

// POST: Check migration status (admin-only)
export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const svc = await createServiceClient();
  const results: string[] = [];

  for (const table of ['drop_products', 'drop_stock_checks', 'drop_alerts', 'drop_watchlist', 'drop_purchases']) {
    const { error } = await svc.from(table).select('id').limit(1);
    if (error?.code === 'PGRST205' || error?.message?.includes('does not exist')) {
      results.push(`${table}: TABLE DOES NOT EXIST — needs manual SQL migration`);
    } else {
      results.push(`${table}: ✅ exists`);
    }
  }

  const allExist = results.every(r => r.includes('✅'));

  return NextResponse.json({
    status: allExist ? 'all_tables_exist' : 'migration_needed',
    results,
  });
}
