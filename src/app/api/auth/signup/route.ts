import { createClient } from '@/util/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  // This redirect URL must be whitelisted in your Supabase project
  const redirectURL = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectURL,
    },
  });

  if (error) {
    console.error('Sign Up Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: 'Confirmation email sent successfully' });
}