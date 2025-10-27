import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { InviteUserEarlyAccessEmail } from './invite-user-early-access-email';

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

export const Primary: Story = {
  args: {
  },
};