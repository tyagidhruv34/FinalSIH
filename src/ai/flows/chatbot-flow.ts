
'use server';

/**
 * @fileOverview A simple chatbot flow for the Sankat Mochan app.
 *
 * - chat - A function that handles the chatbot conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatHistoryMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(ChatHistoryMessageSchema),
  message: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  message: z.string(),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const systemPrompt = `You are a helpful AI assistant for the Sankat Mochan disaster management app.
    Your purpose is to answer user questions about disaster preparedness, safety procedures, and how to use the app.
    Be concise, helpful, and reassuring.
    If a user seems to be in immediate danger, strongly advise them to press the SOS button immediately.
    You do not have access to real-time data, so do not provide specific, real-time advice. Instead, provide general safety guidelines.
    Today's date is ${new Date().toLocaleDateString()}.`;

    const model = ai.model;
    
    const response = await ai.generate({
        model: model,
        prompt: input.message,
        history: [{role: 'system', content: systemPrompt}, ...input.history],
    });

    if (!response || !response.text) {
        throw new Error("The AI model did not return a valid message.");
    }
    
    return {
      message: response.text,
    };
  }
);


export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatbotFlow(input);
}
