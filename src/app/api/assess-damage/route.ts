import { NextResponse } from 'next/server';
import { assessDamage } from '@/ai/flows/assess-damage-flow';

const hasAiKey = !!process.env.GOOGLE_GENAI_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!hasAiKey) {
      // Fallback so the feature works locally without the AI key.
      return NextResponse.json({
        severity: 'Moderate',
        confidenceScore: 70,
        reasoning:
          'AI key not configured; returning a sample assessment. Provide GOOGLE_GENAI_API_KEY for live analysis.',
      });
    }

    const result = await assessDamage(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Assess damage error:', error);
    return NextResponse.json(
      { error: 'Failed to assess damage' },
      { status: 500 }
    );
  }
}

