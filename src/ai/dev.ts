import { config } from 'dotenv';
config();

import '@/ai/flows/flag-duplicate-updates.ts';
import '@/ai/flows/summarize-alerts.ts';
import '@/ai/flows/personalized-alert-source-selection.ts';
import '@/ai/flows/assess-damage-flow.ts';
import '@/ai/flows/extract-face-embeddings-flow.ts';
import '@/ai/flows/find-matching-faces-flow.ts';
