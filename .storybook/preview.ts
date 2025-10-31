import '../app/globals.css';
import type { Preview } from '@storybook/nextjs-vite'
import { sb } from 'storybook/test';

sb.mock(import('../lib/db/drizzle.ts'), { spy: true });
sb.mock(import('../lib/db/queries/user.ts'), { spy: true });


const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;