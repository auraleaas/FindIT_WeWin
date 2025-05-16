import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { geminiModel, speechClient, ttsClient } from "~/server/gemini";
import { TRPCError } from "@trpc/server";

export const voiceRouter = createTRPCRouter({
  processVoice: publicProcedure
    .input(
      z.object({
        audioBase64: z.string().optional(), // Base64 encoded audio file (optional now)
        textInput: z.string().optional(),   // Direct text input as alternative
      })
    )
    .mutation(async ({ input }) => {
      try {
        let transcript = '';
        
        // Process either audio or direct text input
        if (input.audioBase64) {
          // 1. Speech-to-Text (sync)
          const [stt] = await speechClient.recognize({
            config: { 
              // More flexible configuration for different audio formats
              encoding: 'ENCODING_UNSPECIFIED', // Let the API detect the encoding
              sampleRateHertz: 48000, // Common for browser recordings
              languageCode: 'en-US',
              model: 'default', // Use the default model
              useEnhanced: true, // Better quality transcription
            },
            audio: { content: input.audioBase64 },
          });
          
          transcript = stt.results?.[0]?.alternatives?.[0]?.transcript || '';
        } else if (input.textInput) {
          // Use the direct text input instead
          transcript = input.textInput;
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No input provided"
          });
        }
        
        // If no transcript, return early
        if (!transcript) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not transcribe audio or no text was provided"
          });
        }

        // 2. Gemini (direct API)
        const result = await geminiModel.generateContent(transcript);
        const response = await result.response;
        const answer = response.text() || '';
        
        // 3. Text-to-Speech
        const [audio] = await ttsClient.synthesizeSpeech({
          input: { text: answer },
          voice: { languageCode: 'en-US', name: 'en-US-Standard-D' },
          audioConfig: { audioEncoding: 'MP3' },
        });

        return {
          transcript,
          answer,
          audioDataUrl: `data:audio/mp3;base64,${audio.audioContent?.toString('base64')}`,
        };
      } catch (error) {
        console.error("Voice processing error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process input",
        });
      }
    }),
});