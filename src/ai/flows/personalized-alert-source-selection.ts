
'use server';
/**
 * @fileOverview This file defines a Genkit flow for personalizing alert sources based on user settings.
 *
 * - personalizedAlertSourceSelection - A function that handles the selection of alert sources based on user preferences.
 * - PersonalizedAlertSourceSelectionInput - The input type for the personalizedAlertSourceSelection function.
 * - PersonalizedAlertSourceSelectionOutput - The return type for the personalizedAlertSourceSelection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedAlertSourceSelectionInputSchema = z.object({
  userSettings: z.object({
    preferredAlertSources: z.array(z.string()).describe('List of preferred alert sources selected by the user.'),
  }).describe('User settings object containing preferred alert sources.'),
  availableAlertSources: z.array(z.string()).describe('List of available alert sources.'),
});

export type PersonalizedAlertSourceSelectionInput = z.infer<typeof PersonalizedAlertSourceSelectionInputSchema>;

const PersonalizedAlertSourceSelectionOutputSchema = z.object({
  selectedAlertSources: z.array(z.string()).describe('List of alert sources selected based on user preferences.'),
});

export type PersonalizedAlertSourceSelectionOutput = z.infer<typeof PersonalizedAlertSourceSelectionOutputSchema>;


const prompt = ai.definePrompt({
  name: 'personalizedAlertSourceSelectionPrompt',
  input: {
    schema: PersonalizedAlertSourceSelectionInputSchema,
  },
  output: {
    schema: PersonalizedAlertSourceSelectionOutputSchema,
  },
  prompt: `Given the user's preferred alert sources: {{userSettings.preferredAlertSources}} and the available alert sources: {{availableAlertSources}}, select the alert sources that match the user's preferences.\nReturn only alert sources that are both preferred by the user and available in the system.\n`,
});

const personalizedAlertSourceSelectionFlow = ai.defineFlow(
  {
    name: 'personalizedAlertSourceSelectionFlow',
    inputSchema: PersonalizedAlertSourceSelectionInputSchema,
    outputSchema: PersonalizedAlertSourceSelectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI model did not return a valid response.');
    }
    return output;
  }
);


export async function personalizedAlertSourceSelection(
  input: PersonalizedAlertSourceSelectionInput
): Promise<PersonalizedAlertSourceSelectionOutput> {
  return personalizedAlertSourceSelectionFlow(input);
}
