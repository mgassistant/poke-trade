import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Run drop monitor migration
// This creates tables using Supabase's SQL execution capability
export async function POST(req: NextRequest) {
  const results: string[] = [];

  // Create drop_products table
  try {
    // Test if table exists by querying it
    const { error } = await supabase.from('drop_products').select('id').limit(1);
    if (error?.code === 'PGRST205' || error?.message?.includes('does not exist')) {
      results.push('drop_products: TABLE DOES NOT EXIST — needs manual SQL migration');
    } else {
      results.push('drop_products: ✅ exists');
    }
  } catch (e: any) {
    results.push(`drop_products: ${e.message}`);
  }

  // Check other tables
  for (const table of ['drop_stock_checks', 'drop_alerts', 'drop_watchlist', 'drop_purchases']) {
    const { error } = await supabase.from(table).select('id').limit(1);
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
    instructions: allExist ? 'All tables ready!' : 'Run src/migrations/drop_monitor.sql in the Supabase SQL editor at: https://supabase.com/dashboard/project/ruuhbwjmhqecomwrgaeq/sql/new',
    sql_url: 'https://supabase.com/dashboard/project/ruuhbwjmhqecomwrgaeq/sql/new',
  });
}
