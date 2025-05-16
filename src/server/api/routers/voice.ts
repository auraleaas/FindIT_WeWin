import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { geminiModel, speechClient, ttsClient } from "~/server/gemini";
import { TRPCError } from "@trpc/server";

export const voiceRouter = createTRPCRouter({
  processVoice: publicProcedure
    .input(
      z.object({
        audioBase64: z.string(), // Base64 encoded audio file
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 1. Speech-to-Text (sync)
        const [stt] = await speechClient.recognize({
          config: { 
            encoding: 'WEBM_OPUS', // For WebM audio from browser
            sampleRateHertz: 48000, // Common for browser recordings
            languageCode: 'en-US'
          },
          audio: { content: input.audioBase64 },
        });
        
        const transcript = stt.results?.[0]?.alternatives?.[0]?.transcript || '';
        
        // If no transcript, return early
        if (!transcript) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not transcribe audio"
          });
        }

        // 2. Gemini (direct API)
        const result = await geminiModel.generateContent(transcript);
        const response = await result.response;
        const answer = response.text() || '';
        
        // 3. Text-to-Speech
        const [audio] = await ttsClient.synthesizeSpeech({
          input: { text: answer },
          voice: { languageCode: 'en-US', name: 'en-US-Standard-D' }, // Using Standard voice instead of Studio
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
          message: "Failed to process voice input",
        });
      }
    }),
});