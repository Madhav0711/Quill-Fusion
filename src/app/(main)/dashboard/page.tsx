import DashboardSetup from '@/components/dashboard-setup/dashboard-setup';
import { createClient } from '@/util/supabase/server';
import { redirect } from 'next/navigation';

const DashboardPage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*, folders(*, files(*))')
    .eq('workspace_owner', user.id)
    .limit(1) 
    .single(); 

  if (workspace) {
    return redirect(`/dashboard/${workspace.id}`);
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  return (
    <div className="bg-background h-screen w-screen flex justify-center items-center">
      <DashboardSetup user={user} subscription={subscription} />
    </div>
  );
};

export default DashboardPage;