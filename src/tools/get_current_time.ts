import type { Tool } from './index.js';

export const getCurrentTimeTool: Tool = {
  name: "get_current_time",
  description: "Get the current time, date, and timezone of the system.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  },
  execute: () => {
    const now = new Date();
    return `The current local time is: ${now.toLocaleString()} (${now.getTimezoneOffset()} min offset)`;
  }
};
