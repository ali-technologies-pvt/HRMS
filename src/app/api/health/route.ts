import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const hasMongoEnv = !!process.env.MONGODB_URI;
  const hasSupabaseEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let mongoStatus = 'not_configured';
  if (hasMongoEnv && clientPromise) {
    try {
      const client = await clientPromise;
      await client.db().admin().ping();
      mongoStatus = 'connected';
    } catch (e: any) {
      mongoStatus = `error: ${e.message}`;
    }
  }

  const supabaseStatus = hasSupabaseEnv ? 'configured' : 'not_configured';

  return NextResponse.json({
    status: 'healthy',
    system: 'quickslogx HRMS',
    version: '2.6.0',
    deployment: 'Cloud Enterprise Ready',
    timestamp: new Date().toISOString(),
    databases: {
      mongodb: {
        configured: hasMongoEnv,
        status: mongoStatus
      },
      supabase: {
        configured: hasSupabaseEnv,
        status: supabaseStatus
      },
      edgeFallback: 'Active (Zero-config in-memory & localStorage sync)'
    }
  });
}
