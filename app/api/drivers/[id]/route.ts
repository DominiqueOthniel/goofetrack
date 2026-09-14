import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Driver not found');
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('Error fetching driver:', err);
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
      .from('drivers')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Driver not found');
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('Error updating driver:', err);
    return serverErrorResponse(err.message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', params.id);

    if (error) {
      return errorResponse(error.message, 500);
    }

    return NextResponse.json({ message: 'Driver deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting driver:', err);
    return serverErrorResponse(err.message);
  }
}
