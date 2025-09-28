'use server';

/**
 * @fileOverview An AI flow to find matching faces.
 *
 * - findMatchingFaces - Finds potential matches for a face from a gallery of known faces.
 * - FindMatchingFacesInput - Input type for the flow.
 * - FindMatchingFacesOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Simple cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  
  if (magA === 0 || magB === 0) return 0;
  
  return dotProduct / (magA * magB);
}

const KnownFaceSchema = z.object({
    id: z.string().describe("The unique identifier for the known person."),
    photoUrl: z.string().describe("The URL to the photo of the known person."),
    name: z.string().describe("The name of the known person."),
    embedding: z.array(z.number()).describe("The stored face embedding for the known person."),
});

const FindMatchingFacesInputSchema = z.object({
  queryPhotoDataUri: z
    .string()
    .describe(
      "A photo of the person to find, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  knownFaces: z.array(KnownFaceSchema).describe("An array of known faces to compare against."),
});
export type FindMatchingFacesInput = z.infer<typeof FindMatchingFacesInputSchema>;

const MatchResultSchema = z.object({
    id: z.string(),
    name: z.string(),
    photoUrl: z.string(),
    confidenceScore: z.number().min(0).max(100),
});

const FindMatchingFacesOutputSchema = z.object({
  matches: z.array(MatchResultSchema).describe('A list of potential matches, sorted by confidence.'),
});
export type FindMatchingFacesOutput = z.infer<typeof FindMatchingFacesOutputSchema>;

export async function findMatchingFaces(input: FindMatchingFacesInput): Promise<FindMatchingFacesOutput> {
  return findMatchingFacesFlow(input);
}

const faceEmbeddingsModel = googleAI.model('text-embedding-004');

const findMatchingFacesFlow = ai.defineFlow(
  {
    name: 'findMatchingFacesFlow',
    inputSchema: FindMatchingFacesInputSchema,
    outputSchema: FindMatchingFacesOutputSchema,
  },
  async (input) => {
    // 1. Generate embedding for the query image
    const { embedding: queryEmbedding } = await ai.embed({
        model: faceEmbeddingsModel,
        content: { media: { url: input.queryPhotoDataUri } },
        taskType: 'RETRIEVAL_QUERY',
    });

    if (!queryEmbedding) {
      throw new Error('Could not generate embedding for the query image.');
    }
    
    // 2. Compare with known faces
    const similarityScores = input.knownFaces.map(knownFace => ({
        ...knownFace,
        similarity: cosineSimilarity(queryEmbedding, knownFace.embedding),
    }));

    // 3. Filter, sort, and format results
    const matches = similarityScores
        .filter(item => item.similarity > 0.7) // Use a threshold to filter out poor matches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3) // Return top 3 matches
        .map(match => ({
            id: match.id,
            name: match.name,
            photoUrl: match.photoUrl,
            confidenceScore: match.similarity * 100, // Convert to percentage
        }));

    return { matches };
  }
);
