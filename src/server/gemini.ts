import { GoogleGenerativeAI } from '@google/generative-ai';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { env } from '~/env';

// Initialize the Gemini AI API with your API key
export const genAI = new GoogleGenerativeAI(env.GOOGLE_GEMINI_API_KEY);

// Get the generative model
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
});

// Speech-to-Text and Text-to-Speech clients remain the same
export const speechClient = new SpeechClient();
export const ttsClient = new TextToSpeechClient();