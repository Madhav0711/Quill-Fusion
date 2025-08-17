export const dynamic = 'force-dynamic';

import React from 'react';
import QuillEditor from '@/components/quill-editor/quill-editor';
import { getFolderDetails } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';

const FolderPage = async ({ params }: { params: { folderId: string } }) => {
  const awaitedParams = await params;
  const { data, error } = await getFolderDetails(awaitedParams.folderId);

  if (error || !data) {
    redirect('/dashboard');
  }

  return (
    <div className="relative">
      <QuillEditor
        dirType="folder"
        fileId={awaitedParams.folderId}
        dirDetails={data}
      />
    </div>
  );
};

export default FolderPage;