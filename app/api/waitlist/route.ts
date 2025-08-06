import { NextResponse } from 'next/server';
import { addToWaitlist } from '@/lib/db/queries/waitlist';
import { sendWaitlistConfirmationEmail } from '@/lib/email/waitlist';

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();

    if (!email || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const formdata = new FormData();
    formdata.append('email', email);
    formdata.append('username', username);
    
    await addToWaitlist({ username, email });
    await sendWaitlistConfirmationEmail(formdata);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('waitlist API error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
