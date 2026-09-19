import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { createHandler } from '@/lib/crud';
import { parcelExpeditionsResource } from '@/lib/resources';
import { successResponse, supabaseErrorResponse, unexpectedErrorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export const POST = createHandler(parcelExpeditionsResource);

const EXACT_FILTERS = ['statut', 'chauffeurId', 'tracteurId', 'remorqueuseId'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let query = supabase.from('parcel_expeditions').select('*');

    for (const filter of EXACT_FILTERS) {
      const value = searchParams.get(filter);
      if (value) query = query.eq(filter, value);
    }

    const destination = searchParams.get('destination');
    if (destination) query = query.ilike('destination', `%${destination}%`);

    const dateDepartFrom = searchParams.get('dateDepartFrom');
    if (dateDepartFrom) query = query.gte('dateDepart', dateDepartFrom);

    const dateDepartTo = searchParams.get('dateDepartTo');
    if (dateDepartTo) query = query.lte('dateDepart', dateDepartTo);

    const search = searchParams.get('q');
    if (search) {
      const pattern = `%${search}%`;
      query = query.or(
        `reference.ilike.${pattern},origine.ilike.${pattern},destination.ilike.${pattern}`,
      );
    }

    const { data, error } = await query.order('dateDepart', { ascending: false });
    if (error) return supabaseErrorResponse(error);

    return successResponse(data ?? []);
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
