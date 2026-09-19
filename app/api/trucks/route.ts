import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('trucks')
      .select('*, proprietaire:third_parties!proprietaireId(*), chauffeur:drivers!chauffeurId(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse(error.message, 500);
    }

    return successResponse(data || []);
  } catch (err: any) {
    console.error('Error fetching trucks:', err);
    return serverErrorResponse(err.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newTruck = {
      id: uuidv4(),
      ...body,
    };

    const { data, error } = await supabase
      .from('trucks')
      .insert([newTruck])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse(error.message, 500);
    }

    return successResponse(data, 201);
  } catch (err: any) {
    console.error('Error creating truck:', err);
    return serverErrorResponse(err.message);
  }
}
