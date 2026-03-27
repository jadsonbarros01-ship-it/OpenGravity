export type Tool = {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<string> | string;
};

import { getCurrentTimeTool } from './get_current_time.js';
import { wooCommerceTool } from './woocommerce.js';

export const TOOLS: Tool[] = [
  getCurrentTimeTool,
  wooCommerceTool,
];

// Map for quick execution
export const TOOL_REGISTRY: Record<string, Tool> = TOOLS.reduce((acc, tool) => {
  acc[tool.name] = tool;
  return acc;
}, {} as Record<string, Tool>);

export const formattedToolsForLLM: any[] = TOOLS.map(tool => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }
}));
