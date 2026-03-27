import { bot } from './bot/telegram.js';
import { ENV } from './config/env.js';

async function bootstrap() {
    console.log("======================================");
    console.log("      🚀 Starting OpenGravity");
    console.log("======================================");
    
    // Start long polling without a web server
    bot.start({
        onStart: (botInfo) => {
            console.log(`✅ OpenGravity bot started successfully as @${botInfo.username}`);
            console.log(`🔒 Allowed User IDs: ${ENV.TELEGRAM_ALLOWED_USER_IDS}`);
            console.log(`🤖 Using Groq API: ${ENV.GROQ_API_KEY && ENV.GROQ_API_KEY !== 'SUSTITUYE_POR_EL_TUYO' ? 'Yes' : 'No'}`);
            console.log(`💾 Local Memory DB attached at: ${ENV.DB_PATH}`);
            console.log("--------------------------------------");
            console.log("Waiting for messages...");
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
