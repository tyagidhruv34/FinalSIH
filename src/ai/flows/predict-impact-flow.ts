'use server';

/**
 * @fileOverview An AI flow to predict disaster impact at a hyper-local level.
 *
 * - predictImpact - A function that analyzes location and disaster type to predict impact.
 * - PredictImpactInput - The input type for the predictImpact function.
 * - PredictImpactOutput - The return type for the predictImpact function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictImpactInputSchema = z.object({
  locationDescription: z
    .string()
    .describe(
      'A description of the hyper-local area, including city, district, and any known geographical features (e.g., "Low-lying coastal village of Ramapuram, near Chennai").'
    ),
  disasterType: z
    .enum(['Cyclone', 'Flood', 'Earthquake', 'Wildfire', 'Landslide'])
    .describe('The type of impending disaster.'),
});
export type PredictImpactInput = z.infer<typeof PredictImpactInputSchema>;

const PredictImpactOutputSchema = z.object({
  riskScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'A risk score from 0 to 100, where 100 is the highest risk. The score should be based on a qualitative analysis of the inputs.'
    ),
  potentialImpact: z
    .string()
    .describe(
      'A summary of the potential impact on population, infrastructure, and environment, based on general knowledge of the area type.'
    ),
  evacuationRecommendation: z
    .enum(['None', 'Voluntary', 'Recommended', 'Mandatory'])
    .describe('The recommended evacuation level for the specified area.'),
  reasoning: z
    .string()
    .describe(
      'A brief explanation for the assigned risk score and recommendation, considering factors like geography, disaster type, and potential secondary effects.'
    ),
});
export type PredictImpactOutput = z.infer<typeof PredictImpactOutputSchema>;

export async function predictImpact(input: PredictImpactInput): Promise<PredictImpactOutput> {
  return predictImpactFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictImpactPrompt',
  input: { schema: PredictImpactInputSchema },
  output: { schema: PredictImpactOutputSchema },
  prompt: `You are a disaster management expert AI. Your task is to provide a hyper-local risk assessment based on the provided information.

You are not connected to real-time data feeds, so you must use your general knowledge to infer risk based on the description of the location and the type of disaster.

Location: {{{locationDescription}}}
Disaster Type: {{{disasterType}}}

Analyze the inputs and provide a risk assessment. For example:
- A "low-lying coastal village" will have a very high risk score for a "Cyclone" or "Flood".
- A "densely populated city center" in a known seismic zone would have a high risk for an "Earthquake".
- A "forested hill area" would have high risk for "Wildfire" or "Landslide".

Provide a risk score, summarize the potential impact, give a clear evacuation recommendation, and explain your reasoning.
`,
});

const predictImpactFlow = ai.defineFlow(
  {
    name: 'predictImpactFlow',
    inputSchema: PredictImpactInputSchema,
    outputSchema: PredictImpactOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid prediction.');
    }
    return output;
  }
);
