import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { BACKUP_TABLES } from '@/lib/backup';
import { supabaseErrorResponse, unexpectedErrorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data: Record<string, unknown[]> = {};

    for (const { key, table } of BACKUP_TABLES) {
      const { data: rows, error } = await supabase.from(table).select('*');
      if (error) return supabaseErrorResponse(error);
      data[key] = rows ?? [];
    }

    const exportedAt = new Date().toISOString();
    const filename = `sia-goofe-sauvegarde-${exportedAt.slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify({ version: '1.0', exportedAt, data }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
