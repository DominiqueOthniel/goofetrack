import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { successResponse, supabaseErrorResponse, unexpectedErrorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

function parseLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let query = supabase.from('audit_logs').select('*');

    const module = searchParams.get('module');
    if (module) query = query.eq('module', module);

    const action = searchParams.get('action');
    if (action) query = query.eq('action', action);

    const actorLogin = searchParams.get('actorLogin');
    if (actorLogin) query = query.eq('actorLogin', actorLogin);

    const from = searchParams.get('from');
    if (from) query = query.gte('createdAt', from);

    const to = searchParams.get('to');
    if (to) query = query.lte('createdAt', to);

    const { data, error } = await query
      .order('createdAt', { ascending: false })
      .limit(parseLimit(searchParams.get('limit')));

    if (error) return supabaseErrorResponse(error);

    return successResponse(data ?? []);
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
