
'use server';

/**
 * @fileOverview An AI flow to extract face embeddings from an image.
 *
 * - extractFaceEmbeddings - Extracts a facial embedding vector from an image.
 * - ExtractFaceEmbeddingsInput - Input type for the flow.
 * - ExtractFaceEmbeddingsOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ExtractFaceEmbeddingsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractFaceEmbeddingsInput = z.infer<typeof ExtractFaceEmbeddingsInputSchema>;

const ExtractFaceEmbeddingsOutputSchema = z.object({
  faceEmbedding: z.array(z.number()).describe('The 1024-dimensional embedding vector for the detected face.'),
});
export type ExtractFaceEmbeddingsOutput = z.infer<typeof ExtractFaceEmbeddingsOutputSchema>;

export async function extractFaceEmbeddings(input: ExtractFaceEmbeddingsInput): Promise<ExtractFaceEmbeddingsOutput> {
  return extractFaceEmbeddingsFlow(input);
}

const faceEmbeddingsModel = googleAI.model('text-embedding-004');

const extractFaceEmbeddingsFlow = ai.defineFlow(
  {
    name: 'extractFaceEmbeddingsFlow',
    inputSchema: ExtractFaceEmbeddingsInputSchema,
    outputSchema: ExtractFaceEmbeddingsOutputSchema,
  },
  async (input) => {
    const { embedding } = await ai.embed({
        model: faceEmbeddingsModel,
        content: { media: { url: input.photoDataUri } },
        taskType: 'RETRIEVAL_DOCUMENT',
    });
    
    if (!embedding) {
        throw new Error('Could not generate face embedding.');
    }

    return { faceEmbedding: embedding };
  }
);
