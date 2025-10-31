import type { StorybookConfig } from '@storybook/nextjs-vite';
import { configDotenv } from 'dotenv';

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.@(js|jsx|mjs|ts|tsx)",
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  "addons": [
    // "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": '@storybook/nextjs-vite',
    "options": {},
  },
  env: (() => {
    const envPath = process.env.NODE_ENV === 'production' ? '../.env' : '../.env.local';
    const result = configDotenv({ path: envPath });
    return result.parsed || {};
  })(),
};
export default config;