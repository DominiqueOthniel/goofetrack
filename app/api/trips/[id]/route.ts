import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        tracteur:trucks!tracteurId(*),
        remorque:trucks!remorqueId(*),
        chauffeur:drivers!chauffeurId(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Trip not found');
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('Error fetching trip:', err);
    return serverErrorResponse(err.message);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('trips')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Trip not found');
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('Error updating trip:', err);
    return serverErrorResponse(err.message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', params.id);

    if (error) {
      return errorResponse(error.message, 500);
    }

    return NextResponse.json({ message: 'Trip deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting trip:', err);
    return serverErrorResponse(err.message);
  }
}
