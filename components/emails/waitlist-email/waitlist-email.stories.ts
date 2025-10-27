import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { WaitlistEmail } from './waitlist-email';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Email/WaitlistEmail',
  component: WaitlistEmail,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WaitlistEmail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    username: "Andres", 
    previewLink: "", 
    spotNumber: Math.random(),
  }
}