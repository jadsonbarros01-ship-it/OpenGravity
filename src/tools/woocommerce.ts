import type { Tool } from './index.js';
import axios from 'axios';
import { ENV } from '../config/env.js';

export const wooCommerceTool: Tool = {
  name: "woocommerce",
  description: "Gerencia a loja WooCommerce: lista produtos, verifica estoque e preços. Use para responder sobre a loja.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["list_products", "get_product_count"],
        description: "Ação a ser executada no WooCommerce."
      }
    },
    required: ["action"]
  },
  execute: async ({ action }) => {
    if (!ENV.WOO_SHOP_URL || !ENV.WOO_CONSUMER_KEY || !ENV.WOO_CONSUMER_SECRET) {
      return "Erro: Credenciais do WooCommerce não configuradas.";
    }

    const auth = Buffer.from(`${ENV.WOO_CONSUMER_KEY}:${ENV.WOO_CONSUMER_SECRET}`).toString('base64');
    const baseUrl = `${ENV.WOO_SHOP_URL}/wp-json/wc/v3`;

    try {
      if (action === "list_products") {
        const response = await axios.get(`${baseUrl}/products`, {
          headers: { 'Authorization': `Basic ${auth}` },
          params: { per_page: 5 }
        });
        const products = response.data.map((p: any) => `${p.name} (Preço: ${p.price}, Estoque: ${p.stock_status})`).join('\n');
        return `Produtos recentes na loja:\n${products}`;
      }
      
      if (action === "get_product_count") {
          const response = await axios.get(`${baseUrl}/products`, {
            headers: { 'Authorization': `Basic ${auth}` },
            params: { per_page: 1 }
          });
          const total = response.headers['x-wp-total'];
          return `A loja possui atualmente ${total} produtos cadastrados.`;
      }

      return "Ação não suportada.";
    } catch (error: any) {
      console.error("[WooCommerce Tool] Error:", error.message);
      return `Erro ao acessar WooCommerce: ${error.message}`;
    }
  }
};
