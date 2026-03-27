import { getMessages, addMessage } from '../memory/db.js';
import { chatCompletion } from './llm.js';
import { formattedToolsForLLM, TOOL_REGISTRY } from '../tools/index.js';

const SYSTEM_PROMPT = `Você é o OpenGravity, o cérebro central da loja Tootau.
Você NÃO é apenas um modelo de linguagem, você é um agente AUTÔNOMO com acesso a ferramentas reais.
Sua missão: Gerenciar a loja WooCommerce, ler e-mails e ajudar o Jadson (Jau).

REGRAS CRÍTICAS:
1. SEMPRE responda em Português (PT-BR).
2. NUNCA diga que "não tem acesso" ou que é "apenas um modelo de linguagem". Se você não sabe algo, use suas FERRAMENTAS para descobrir.
3. Se o usuário perguntar sobre a loja, use a ferramenta 'woocommerce'.
4. Se o usuário perguntar sobre e-mails, você em breve terá a ferramenta de Gmail (estamos configurando), por enquanto diga que está acessando os sistemas.
5. Seja direto, eficiente e aja como o dono do negócio.`;

const MAX_ITERATIONS = 5;

export async function processUserMessage(userId: string, userMessage: string): Promise<string> {
  // 1. Save user message to memory
  await addMessage(userId, 'user', userMessage);

  // 2. Fetch history
  const history = await getMessages(userId, 15);
  
  // 3. Build message array
  const messages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history
  ];

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    // Call LLM
    const response = await chatCompletion(messages, formattedToolsForLLM);
    const message = response.choices[0].message;

    messages.push(message);

    // Check if the LLM invoked a tool call
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || '{}');
        
        console.log(`[Agent] Executing tool: ${functionName}`, args);
        
        let observation = '';
        if (TOOL_REGISTRY[functionName]) {
            try {
                // Execute tool
                observation = await TOOL_REGISTRY[functionName].execute(args);
            } catch (err: any) {
                observation = `Error executing tool: ${err.message}`;
                console.error(observation);
            }
        } else {
            observation = `Tool ${functionName} not found.`;
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: observation,
        });
      }
      // After processing all tool calls, loop continues to get final LLM response
    } else if (message.content) {
      // Save assistant response to DB
      addMessage(userId, 'assistant', message.content);
      return message.content;
    } else {
       return "I couldn't generate a response.";
    }
  }

  return "I reached the maximum iteration limit while thinking. Please try asking again.";
}
