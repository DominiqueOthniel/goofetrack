import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('third_parties')
      .select('*')
      .order('nom', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse(error.message, 500);
    }

    return successResponse(data || []);
  } catch (err: any) {
    console.error('Error fetching third parties:', err);
    return serverErrorResponse(err.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newThirdParty = {
      id: uuidv4(),
      ...body,
    };

    const { data, error } = await supabase
      .from('third_parties')
      .insert([newThirdParty])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse(error.message, 500);
    }

    return successResponse(data, 201);
  } catch (err: any) {
    console.error('Error creating third party:', err);
    return serverErrorResponse(err.message);
  }
}
