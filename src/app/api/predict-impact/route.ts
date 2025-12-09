import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Lazy load genkit to avoid build-time initialization issues
    const { predictImpact } = await import('@/ai/flows/predict-impact-flow');
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






