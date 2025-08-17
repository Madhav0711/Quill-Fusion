export const dynamic = 'force-dynamic';

import React from 'react';
import QuillEditor from '@/components/quill-editor/quill-editor';
import { getFileDetails } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';

const File = async ({ params }: { params: { fileId: string } }) => {
  const awaitedparams = await params;
  const { data, error } = await getFileDetails(awaitedparams.fileId);

  if (error || !data) {
    redirect('/dashboard');
  }

  return (
    <div className="relative ">
      <QuillEditor
        dirType="file"
        fileId={awaitedparams.fileId}
        dirDetails={data}
      />
    </div>
  );
};

export default File;