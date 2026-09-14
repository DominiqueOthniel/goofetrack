import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Bank account not found');
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('Error fetching bank account:', err);
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
      .from('bank_accounts')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Bank account not found');
      }
      return errorResponse(error.message, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('Error updating bank account:', err);
    return serverErrorResponse(err.message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', params.id);

    if (error) {
      return errorResponse(error.message, 500);
    }

    return NextResponse.json({ message: 'Bank account deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting bank account:', err);
    return serverErrorResponse(err.message);
  }
}
