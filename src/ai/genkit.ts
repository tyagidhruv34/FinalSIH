import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Lazy initialization to prevent build-time errors
let aiInstance: any = null;

export function getAI() {
  if (!aiInstance) {
    try {
      // Only initialize if we have the API key
      if (process.env.GOOGLE_GENAI_API_KEY) {
        aiInstance = genkit({
          plugins: [googleAI()],
          model: 'googleai/gemini-2.5-flash',
        });
      } else {
        console.warn('GOOGLE_GENAI_API_KEY not set, AI features will be disabled');
        aiInstance = null;
      }
    } catch (error) {
      console.error('Failed to initialize Genkit:', error);
      aiInstance = null;
    }
  }
  return aiInstance;
}

// Export for backward compatibility
export const ai = getAI();
