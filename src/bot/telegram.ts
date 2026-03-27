import { Bot, Context, NextFunction, InputFile } from "grammy";
import { ENV } from "../config/env.js";
import { processUserMessage } from "../agent/loop.js";
import { clearMessages } from "../memory/db.js";
import { transcribeAudio, generateSpeech } from "../agent/llm.js";
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import axios from 'axios';

// Make sure token exists
if (!ENV.TELEGRAM_BOT_TOKEN || ENV.TELEGRAM_BOT_TOKEN === 'SUSTITUYE_POR_EL_TUYO') {
    throw new Error("Invalid or missing TELEGRAM_BOT_TOKEN in .env");
}

export const bot = new Bot(ENV.TELEGRAM_BOT_TOKEN);

// Parse allowed IDs
const allowedIds = ENV.TELEGRAM_ALLOWED_USER_IDS
  .split(',')
  .map(id => id.trim())
  .filter(id => id.length > 0);

// Strict Whitelist middleware
async function whitelistMiddleware(ctx: Context, next: NextFunction) {
  const userId = ctx.from?.id.toString();
  
  if (ENV.TELEGRAM_ALLOWED_USER_IDS === 'SUSTITUYE_POR_EL_TUYO') {
     await next();
     return;
  }

  if (!userId || !allowedIds.includes(userId)) {
    console.warn(`[Security] Unauthorized access attempt from User ID: ${userId}`);
    return;
  }
  await next();
}

bot.use(whitelistMiddleware);

// Commands
bot.command("start", async (ctx) => {
  await ctx.reply("Welcome to OpenGravity. I am your personal local AI assistant. Send me a message or voice to begin.");
});

bot.command("clear", async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (userId) {
     await clearMessages(userId);
     await ctx.reply("Conversation memory cleared locally.");
  }
});

// Voice messages handler
bot.on("message:voice", async (ctx) => {
    const userId = ctx.from.id.toString();
    await ctx.replyWithChatAction("record_voice");

    try {
        const file = await ctx.getFile();
        const inputPath = path.join(os.tmpdir(), `voice_in_${userId}.oga`);
        const outputPath = path.join(os.tmpdir(), `voice_out_${userId}.mp3`);
        
        // Download using the bot's token (standard grammY way for small files)
        const responseData = await axios.get(`https://api.telegram.org/file/bot${ENV.TELEGRAM_BOT_TOKEN}/${file.file_path}`, { responseType: 'arraybuffer' });
        await fs.writeFile(inputPath, Buffer.from(responseData.data));
        
        // 1. Transcribe (Any Language)
        const transcription = await transcribeAudio(fs.createReadStream(inputPath));
        console.log(`[Bot] Transcribed voice from ${userId}: ${transcription}`);
        
        // 2. Process with Agent (Translates to PT internally via System Prompt)
        const responseText = await processUserMessage(userId, transcription);
        
        // 3. Generate Speech (ElevenLabs - PT Voice)
        await generateSpeech(responseText, outputPath);

        // 4. Send Voice Response
        await ctx.replyWithVoice(new InputFile(outputPath));

        // Cleanup
        await fs.unlink(inputPath);
        await fs.unlink(outputPath);
    } catch (error: any) {
        console.error("[Bot] Error processing voice-to-voice:", error);
        await ctx.reply(`Error processing voice: ${error.message}`);
    }
});

// General text messages
bot.on("message:text", async (ctx) => {
   const userId = ctx.from.id.toString();
   const text = ctx.message.text;

   await ctx.replyWithChatAction("typing");

   try {
       const response = await processUserMessage(userId, text);
       await ctx.reply(response);
   } catch (error: any) {
       console.error("[Bot] Error processing message:", error);
       await ctx.reply(`Error processing your request: ${error.message}`);
   }
});
