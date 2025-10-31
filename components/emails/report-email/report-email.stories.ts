import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ReportEmail } from './report-email';

const meta = {
  title: 'Email/ReportEmail',
  component: ReportEmail,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ReportEmail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    markdownContent:
      '# 🎓 Your Career Path Report\n\nCongratulations! Your personalized career report is ready.\n\n## What’s Inside\n- Executive summary\n- Top 4 career paths\n- Market data & salary projections\n- Learning roadmap\n\n---\n\nThank you for using CareerPath!\n',
  },
};