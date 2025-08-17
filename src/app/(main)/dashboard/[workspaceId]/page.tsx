export const dynamic = 'force-dynamic';

import React from 'react'
import { getWorkspaceDetails } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import QuillEditor from '@/components/quill-editor/quill-editor';

const Workspace = async ({ params }: { params: { workspaceId: string } }) => {
  const awaitedparams = await params;
  const { data, error } = await getWorkspaceDetails(awaitedparams.workspaceId);

  if (error || !data) {
    redirect('/dashboard');
  }
  
  return (
    <div className="relative">
      <QuillEditor
        dirType="workspace"
        fileId={awaitedparams.workspaceId}
        dirDetails={data}
      />
    </div>
  )
}

export default Workspace