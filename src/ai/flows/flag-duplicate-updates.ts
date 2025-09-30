'use server';

/**
 * @fileOverview A flow to flag duplicate or similar user status updates.
 *
 * - flagDuplicateUpdates - A function that flags duplicate status updates.
 * - FlagDuplicateUpdatesInput - The input type for the flagDuplicateUpdates function.
 * - FlagDuplicateUpdatesOutput - The return type for the flagDuplicateUpdates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FlagDuplicateUpdatesInputSchema = z.object({
  newUpdate: z.string().describe('The new user status update.'),
  existingUpdates: z
    .array(z.string())
    .describe('A list of existing user status updates.'),
});
export type FlagDuplicateUpdatesInput = z.infer<
  typeof FlagDuplicateUpdatesInputSchema
>;

const FlagDuplicateUpdatesOutputSchema = z.object({
  isDuplicate: z
    .boolean()
    .describe(
      'Whether the new update is a duplicate or very similar to an existing update.'
    ),
  similarityScore: z
    .number()
    .optional()
    .describe(
      'A score indicating the similarity between the new update and the most similar existing update. Higher values indicate greater similarity.'
    ),
});
export type FlagDuplicateUpdatesOutput = z.infer<
  typeof FlagDuplicateUpdatesOutputSchema
>;

export async function flagDuplicateUpdates(
  input: FlagDuplicateUpdatesInput
): Promise<FlagDuplicateUpdatesOutput> {
  return flagDuplicateUpdatesFlow(input);
}

const flagDuplicateUpdatesPrompt = ai.definePrompt({
  name: 'flagDuplicateUpdatesPrompt',
  input: {schema: FlagDuplicateUpdatesInputSchema},
  output: {schema: FlagDuplicateUpdatesOutputSchema},
  prompt: `You are an expert system designed to detect duplicate or near-duplicate user status updates in a disaster management application.

You will be provided with a new user status update and a list of existing updates. Your task is to determine if the new update is substantially similar to any of the existing updates.

Here's how you should approach this task:

1.  **Semantic Similarity Assessment:** Evaluate the new update against each of the existing updates for semantic similarity. Consider the meaning and context of the updates, not just the exact words used.
2.  **Threshold for Duplication:** If the new update is very similar to an existing update (e.g., expresses the same information or sentiment), flag it as a duplicate.

New Update: {{{newUpdate}}}

Existing Updates:
{{#each existingUpdates}}
- {{{this}}}
{{/each}}

Based on your analysis, determine whether the new update is a duplicate of any of the existing updates.
`,
});

const flagDuplicateUpdatesFlow = ai.defineFlow(
  {
    name: 'flagDuplicateUpdatesFlow',
    inputSchema: FlagDuplicateUpdatesInputSchema,
    outputSchema: FlagDuplicateUpdatesOutputSchema,
  },
  async input => {
    const {output} = await flagDuplicateUpdatesPrompt(input);
    return output!;
  }
);
