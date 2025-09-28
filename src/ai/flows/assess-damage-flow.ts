'use server';

/**
 * @fileOverview An AI flow to assess structural damage from an image.
 *
 * - assessDamage - A function that analyzes an image of damage.
 * - AssessDamageInput - The input type for the assessDamage function.
 * - AssessDamageOutput - The return type for the assessDamage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GeoPoint } from 'firebase/firestore';

const AssessDamageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of potential structural damage, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('An optional user-provided description of the damage.'),
  location: z.custom<GeoPoint>().optional().describe('The geographical location where the photo was taken.'),
});
export type AssessDamageInput = z.infer<typeof AssessDamageInputSchema>;

const AssessDamageOutputSchema = z.object({
  severity: z
    .enum(['No Damage', 'Minor', 'Moderate', 'Severe', 'Destroyed'])
    .describe('The classified severity of the damage.'),
  confidenceScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A percentage score representing the confidence in the severity assessment.'),
  reasoning: z
    .string()
    .describe('A brief explanation of why the specific severity level was chosen, based on visual evidence from the image.'),
});
export type AssessDamageOutput = z.infer<typeof AssessDamageOutputSchema>;


export async function assessDamage(input: AssessDamageInput): Promise<AssessDamageOutput> {
  return assessDamageFlow(input);
}


const prompt = ai.definePrompt({
  name: 'assessDamagePrompt',
  input: { schema: AssessDamageInputSchema },
  output: { schema: AssessDamageOutputSchema },
  prompt: `You are an expert civil engineer specializing in structural damage assessment for disaster response. Your task is to analyze an image and classify the level of damage.

You will be provided with an image and an optional text description.

Analyze the provided image for any signs of structural damage. This could include cracks, collapses, flooding, fire damage, or other visible issues.

Based on your analysis, classify the damage into one of the following five categories:
1.  **No Damage**: The structure appears intact and safe.
2.  **Minor**: Superficial damage, such as small cracks, broken windows, or minor water damage. The structure is likely safe.
3.  **Moderate**: Significant damage is visible. Large cracks, partial wall collapse, or significant water/fire damage. The structure may be unsafe.
4.  **Severe**: Major structural failure. Partial or total roof collapse, foundational issues, or large sections of walls missing. The structure is unsafe.
5.  **Destroyed**: The structure is completely unsalvageable. Total collapse or gone entirely.

Provide your assessment in the required JSON output format. The 'reasoning' should be a concise, technical explanation for your classification based on what you see in the image. The 'confidenceScore' should reflect how certain you are of your assessment.

User's description of the scene: {{{description}}}
Photo of the damage: {{media url=photoDataUri}}`,
});


const assessDamageFlow = ai.defineFlow(
  {
    name: 'assessDamageFlow',
    inputSchema: AssessDamageInputSchema,
    outputSchema: AssessDamageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid assessment.');
    }
    return output;
  }
);
