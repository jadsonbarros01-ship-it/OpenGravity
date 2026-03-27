import { google } from 'googleapis';
import type { Tool } from './index.js';
import fs from 'fs-extra';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.resolve(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.resolve(process.cwd(), 'credentials.json');

async function getAuthClient() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error("credentials.json not found. Please provide it in the root directory.");
    }
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    
    const auth = new google.auth.OAuth2(key.client_id, key.client_secret, key.redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = await fs.readFile(TOKEN_PATH, 'utf-8');
        auth.setCredentials(JSON.parse(token));
    } else {
        throw new Error("token.json not found. You need to authenticate once to generate it.");
    }
    return auth;
}

export const gmailTool: Tool = {
  name: "gmail",
  description: "Lê e resume os e-mails mais recentes do Jadson. Use para responder sobre 'meu último e-mail'.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["list_latest"],
        description: "Ação a ser executada no Gmail."
      },
      count: {
         type: "number",
         default: 1,
         description: "Quantidade de e-mails para ler."
      }
    },
    required: ["action"]
  },
  execute: async ({ action, count = 1 }) => {
    try {
        const auth = await getAuthClient();
        const gmail = google.gmail({ version: 'v1', auth });

        if (action === "list_latest") {
            const res = await gmail.users.messages.list({ userId: 'me', maxResults: count });
            const messages = res.data.messages || [];

            if (messages.length === 0) return "Nenhum e-mail encontrado.";

            let results = [];
            for (const msg of messages) {
                const details = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
                const snippet = details.data.snippet;
                const subject = details.data.payload?.headers?.find(h => h.name === 'Subject')?.value || 'Sem Assunto';
                results.push(`📧 Assunto: ${subject}\nResumo: ${snippet}`);
            }
            return results.join('\n\n');
        }
        return "Ação não suportada.";
    } catch (error: any) {
        console.error("[Gmail Tool] Error:", error.message);
        return `Erro ao acessar Gmail: ${error.message}. Certifique-se de que o token.json existe no servidor.`;
    }
  }
};
