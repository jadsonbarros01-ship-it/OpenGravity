# Como hospedar o OpenGravity Bot no Hugging Face (Grátis 24/7) 🚀🦾

O Hugging Face Spaces permite rodar containers Docker permanentemente. Siga estes passos para migrar:

## Passo 1: Criar o Espaço (Space)
1. Acesse: [huggingface.co/new-space](https://huggingface.co/new-space)
2. **Space Name:** `opengravity-bot` (ou o nome que preferir)
3. **Select the Space SDK:** Escolha **Docker**.
4. **Template:** Escolha **Blank**.
5. **Space Hardware:** CPU Basic (Free).
6. **Visibility:** Public ou Private (recomendo Private se quiser esconder seus arquivos).
7. Clique em **Create Space**.

## Passo 2: Configurar as Chaves (Secrets)
Para não expor seu token, vamos usar o sistema de Secrets do Hugging Face:
1. Vá na aba **Settings** do seu Space.
2. Procure por **Variables and secrets**.
3. Clique em **New secret** para CADA uma destas variáveis do seu arquivo `.env`:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_ALLOWED_USER_IDS`
   - `WOO_SHOP_URL`
   - `WOO_CONSUMER_KEY`
   - `WOO_CONSUMER_SECRET`
   - `GEMINI_API_KEY`
   *(Copie os valores do seu `.env` local)*.

## Passo 3: Subir os Arquivos
Você pode subir diretamente pelo navegador na aba **Files**:
1. Clique em **Add file** -> **Upload files**.
2. Selecione e suba estes arquivos e pastas:
   - `src/` (a pasta inteira)
   - `agents/` (a pasta inteira)
   - `package.json`
   - `Dockerfile` (use o que eu alterei abaixo)
   - `tsconfig.json` (se existir)

## Passo 4: Pronto! 🏁
O Hugging Face vai começar a construir (Build) o seu robô automaticamente. 
- Acompanhe o progresso na aba **Logs**.
- Quando ficar **Running** em verde, seu robô já estará respondendo no Telegram!

---

### Por que o Hugging Face?
- **Grátis:** Não precisa pagar VPS.
- **24/7:** Ele reinicia sozinho se cair.
- **Seguro:** Suas chaves ficam escondidas nos "Secrets".

🤜🦾🤛...
