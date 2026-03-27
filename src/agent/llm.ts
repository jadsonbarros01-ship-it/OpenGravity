import Groq from "groq-sdk";
import OpenAI from "openai";
import axios from 'axios';
import fs from 'fs-extra';
import FormData from 'form-data';
import { ENV } from '../config/env.js';

export const groq = ENV.GROQ_API_KEY && ENV.GROQ_API_KEY !== 'SUSTITUYE_POR_EL_TUYO' 
  ? new Groq({ apiKey: ENV.GROQ_API_KEY }) 
  : null;

const openai = ENV.OPENAI_API_KEY ? new OpenAI({ apiKey: ENV.OPENAI_API_KEY }) : null;

export const openRouter = ENV.OPENROUTER_API_KEY && ENV.OPENROUTER_API_KEY !== 'SUSTITUYE_POR_EL_TUYO'
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: ENV.OPENROUTER_API_KEY,
    }) 
  : null;

export async function chatCompletion(messages: any[], tools?: any[]) {
  if (groq) {
    try {
      return await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        tools,
        tool_choice: tools?.length ? "auto" : "none",
        max_tokens: 1500,
      });
    } catch (e) {
      console.error("Groq attempt failed, trying fallback...", e);
    }
  }
  
  if (openRouter) {
      return await openRouter.chat.completions.create({
        messages,
        model: ENV.OPENROUTER_MODEL,
        tools,
        tool_choice: tools?.length ? "auto" : "none",
      });
  }

  throw new Error("No valid LLM client API key found. Check your .env file.");
}

/**
 * Transcribes audio using Groq Whisper (Ultra fast)
 */
export async function transcribeAudio(fileStream: any): Promise<string> {
    if (!groq) throw new Error("Groq client not initialized for STT.");
    
    // @ts-ignore - Groq SDK type mismatch with fs.ReadStream
    const transcription = await groq.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-large-v3",
        response_format: "verbose_json",
    });
    return transcription.text;
}

/**
 * Generates speech using ElevenLabs (Premium) or OpenAI (Fallback)
 */
export async function generateSpeech(text: string, outputPath: string): Promise<void> {
    if (ENV.ELEVENLABS_API_KEY) {
        try {
            const voiceId = "pNInz6obpgH9P39P4mBB";
            const response = await axios({
                method: 'post',
                url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                data: {
                    text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                },
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': ENV.ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            });
            
            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (e) {
            console.error("ElevenLabs failed, falling back to OpenAI...", e);
        }
    }

    if (openai) {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.writeFile(outputPath, buffer);
    } else {
        throw new Error("No TTS API key configured (ElevenLabs or OpenAI).");
    }
}
