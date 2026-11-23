import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.DEEPSEEK_API_KEY': JSON.stringify(process.env.DEEPSEEK_API_KEY || ''),
    'process.env.DEEPSEEK_MODEL': JSON.stringify(process.env.DEEPSEEK_MODEL || 'deepseek-chat'),
    'process.env.DEEPSEEK_BASE_URL': JSON.stringify(process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
