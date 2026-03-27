import fs from 'fs-extra';
import path from 'path';
import type { Tool } from './index.js';

export const agentFactoryTool: Tool = {
  name: "create_sub_agent_tool",
  description: "Cria uma nova ferramenta (tool) especializada para o ecossistema OpenGravity. O código deve ser em TypeScript e seguir o padrão de ferramentas existente.",
  parameters: {
    type: "object",
    properties: {
      toolName: {
        type: "string",
        description: "Nome único para a nova ferramenta (ex: 'aliexpress_sync')"
      },
      description: {
        type: "string",
        description: "O que a ferramenta faz."
      },
      code: {
        type: "string",
        description: "O código TypeScript completo da ferramenta, seguindo o padrão 'export const toolName: Tool = ...'"
      }
    },
    required: ["toolName", "description", "code"]
  },
  execute: async ({ toolName, description, code }) => {
    const toolsDir = path.join(process.cwd(), 'src', 'tools');
    const filePath = path.join(toolsDir, `${toolName}.ts`);

    try {
      // Basic check: ensure the code contains 'export const'
      if (!code.includes('export const')) {
        return "Erro: O código fornecido não parece exportar uma ferramenta válida.";
      }

      // Write the file
      await fs.writeFile(filePath, code);

      return `Sucesso! Ferramenta '${toolName}' criada em ${filePath}. Agora preciso que o Jadson registre ela no 'src/tools/index.ts' para que eu possa usá-la.`;
    } catch (err: any) {
      return `Erro ao criar ferramenta: ${err.message}`;
    }
  }
};
