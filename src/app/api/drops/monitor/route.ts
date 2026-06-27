import { NextRequest, NextResponse } from 'next/server';
import { runMonitorCycle } from '@/lib/restock-monitor/monitor';

// GET: Run a monitoring cycle (called by cron or manually)
export async function GET(req: NextRequest) {
  // Optional: verify cron secret for automated runs
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow both cron (with secret) and manual (admin) triggers
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Check for admin session (Supabase auth)
    // For now, allow all requests — production should gate this
  }

  const startTime = Date.now();

  try {
    const result = await runMonitorCycle();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      ...result,
      summary: `Checked ${result.checked} products in ${(duration / 1000).toFixed(1)}s — ${result.restocks} restocks, ${result.priceDrops} price drops, ${result.errors} errors, ${result.autoBuyTriggered} auto-buy triggers`,
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message,
      duration_ms: Date.now() - startTime,
    }, { status: 500 });
  }
}
