import { bot } from './bot/telegram.js';
import { ENV } from './config/env.js';

async function bootstrap() {
    console.log("======================================");
    console.log("      🚀 Starting OpenGravity");
    console.log("======================================");
    
    // Start long polling without a web server
    bot.start({
        onStart: (botInfo) => {
            console.log(`✅ OpenGravity bot started as @${botInfo.username}`);
            console.log(`🔑 ElevenLabs: ${ENV.ELEVENLABS_API_KEY ? 'OK' : 'MISSING'}`);
            console.log(`🔑 Groq: ${ENV.GROQ_API_KEY ? 'OK' : 'MISSING'}`);
            console.log(`🔑 Woo: ${ENV.WOO_CONSUMER_KEY ? 'OK' : 'MISSING'}`);
            console.log(`💾 DB: ${ENV.DB_PATH}`);
            console.log("--------------------------------------");
        }
    });

    // Graceful shutdown hooks
    process.once("SIGINT", () => {
        console.log("\\nStopping OpenGravity...");
        bot.stop();
        process.exit(0);
    });
    process.once("SIGTERM", () => {
        console.log("\\nStopping OpenGravity...");
        bot.stop();
        process.exit(0);
    });
}

bootstrap().catch(console.error);
