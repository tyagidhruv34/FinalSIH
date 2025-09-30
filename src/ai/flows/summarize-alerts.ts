
'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing alerts from various official sources.
 *
 * - summarizeAlerts - A function that takes a list of alerts and returns a summarized version.
 * - SummarizeAlertsInput - The input type for the summarizeAlerts function.
 * - SummarizeAlertsOutput - The return type for the summarizeAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAlertsInputSchema = z.object({
  alerts: z
    .array(z.string())
    .describe('A list of alerts from various official sources.'),
  userPreferences: z
    .string()
    .optional()
    .describe('Optional user preferences for alert sources.'),
});
export type SummarizeAlertsInput = z.infer<typeof SummarizeAlertsInputSchema>;

const SummarizeAlertsOutputSchema = z.object({
  summary: z.string().describe('A summarized version of the input alerts.'),
});
export type SummarizeAlertsOutput = z.infer<typeof SummarizeAlertsOutputSchema>;

export async function summarizeAlerts(input: SummarizeAlertsInput): Promise<SummarizeAlertsOutput> {
  return summarizeAlertsFlow(input);
}

const summarizeAlertsPrompt = ai.definePrompt({
  name: 'summarizeAlertsPrompt',
  input: {schema: SummarizeAlertsInputSchema},
  output: {schema: SummarizeAlertsOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing disaster alerts from various official sources.

      Here are the alerts:
      {{#each alerts}}- {{{this}}}\n{{/each}}

      Please provide a concise summary of the alerts, focusing on the most critical information.

      {{#if userPreferences}}
      The user has the following preferences regarding alert sources: {{{userPreferences}}}.
      Please prioritize alerts from sources that align with these preferences.
      {{/if}}`,
});

const summarizeAlertsFlow = ai.defineFlow(
  {
    name: 'summarizeAlertsFlow',
    inputSchema: SummarizeAlertsInputSchema,
    outputSchema: SummarizeAlertsOutputSchema,
  },
  async input => {
    const {output} = await summarizeAlertsPrompt(input);
    if (!output) {
        throw new Error('The AI model did not return a valid response.');
    }
    return output;
  }
);
