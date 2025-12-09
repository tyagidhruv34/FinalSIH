import { NextResponse } from 'next/server';
import { predictImpact } from '@/ai/flows/predict-impact-flow';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await predictImpact(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Predict impact error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze risk' },
      { status: 500 }
    );
  }
}






