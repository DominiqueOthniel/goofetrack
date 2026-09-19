import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { BACKUP_TABLES } from '@/lib/backup';
import {
  errorResponse,
  readJsonBody,
  successResponse,
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const CHUNK_SIZE = 250;

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const payload = (body.data ?? body) as Record<string, unknown>;

    if (typeof payload !== 'object' || payload === null) {
      return errorResponse('La sauvegarde doit contenir un objet `data`.', 400);
    }

    const counts: Record<string, number> = {};

    for (const { key, table } of BACKUP_TABLES) {
      const rows = payload[key];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
        const chunk = rows.slice(index, index + CHUNK_SIZE);
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
        if (error) return supabaseErrorResponse(error);
      }

      counts[key] = rows.length;
    }

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

    return successResponse({
      message: `Restauration terminee : ${total} enregistrements traites.`,
      counts,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON')) {
      return errorResponse(error.message, 400);
    }
    return unexpectedErrorResponse(error);
  }
}
