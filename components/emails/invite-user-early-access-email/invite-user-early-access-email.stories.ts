import type { Meta, StoryObj } from '@storybook/nextjs';

import { fn } from 'storybook/test';

import { InviteUserEarlyAccessEmail } from './invite-user-early-access-email';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Email/InviteUserEarlyAccessEmail',
  component: InviteUserEarlyAccessEmail,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InviteUserEarlyAccessEmail>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
  },
};