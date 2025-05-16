import { VertexAI } from '@google-cloud/vertexai';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { env } from '~/env';

// Singleton instances for Google Cloud services
export const vertex = new VertexAI({
  project: env.GOOGLE_CLOUD_PROJECT,
  location: 'asia-southeast1',
});

export const gemini = vertex.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

export const speechClient = new SpeechClient();

export const ttsClient = new TextToSpeechClient();