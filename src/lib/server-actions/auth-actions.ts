'use server';
import { createClient } from '@/util/supabase/server';
import { redirect } from 'next/navigation';
import { workspaces } from '@/lib/supabase/schema';

interface SignUpUserProps {
  email: string;
  password: string;
}

export async function actionSignUpUser({ email, password }: SignUpUserProps) {
  console.log('SERVER-SIDE ENV VAR:', process.env.NEXT_PUBLIC_SITE_URL);
  console.log('Server Action received:', { email, password });
  const redirectURL = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;
  console.log('Constructed Redirect URL:', redirectURL);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });


  if (error) {
    console.error('Supabase Sign Up Error:', error);
    return { error: { message: error.message } };
  }

  return { data };
}

export async function actionLoginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: { message: error.message } };
  }

  return redirect('/dashboard');
}

export const createWorkspace = async (workspaceData: {
  title: string;
  icon_id: string;
  data: string;
  in_trash: string;
  logo: string | null;
  banner_url: string | null;
  workspace_owner: string;
}) => {
   console.log('Data received by createWorkspace action:', workspaceData);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
    console.error('No authenticated user on the server.');
    return { error: 'You must be logged in to create a workspace.' };
  }

  const { data, error } = await supabase
    .from('workspaces')
    .insert(workspaceData)
    .select() 
    .single();

  if (error) {
    console.error('Error creating workspace:', error);
    return { error: 'Could not create workspace.' };
  }

  redirect(`/dashboard/${data.id}`);
};