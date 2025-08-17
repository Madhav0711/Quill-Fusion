'use client';
import { appFoldersType, useAppState } from '@/lib/providers/state-provider';
import { File } from '@/lib/supabase/supabase.types';
import { FileIcon, FolderIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const TrashRestore = () => {
  const { state, workspaceId } = useAppState();
  const [folders, setFolders] = useState<appFoldersType[] | []>([]);
  const [files, setFiles] = useState<File[] | []>([]);

  useEffect(() => {
    const stateFolders =
      state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.filter((folder) => folder.in_trash) || [];
    setFolders(stateFolders);

    let stateFiles: File[] = [];
    state.workspaces
      .find((workspace) => workspace.id === workspaceId)
      ?.folders.forEach((folder) => {
        folder.files.forEach((file) => {
          if (file.in_trash) {
            stateFiles.push(file);
          }
        });
      });
    setFiles(stateFiles);
  }, [state, workspaceId]);

  return (
    <section className="p-4 space-y-6">
      {!!folders.length && (
        <>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Folders
          </h3>
          <div className="space-y-2">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                href={`/dashboard/${folder.workspaceId}/${folder.id}`}
                className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-muted/70"
              >
                <aside className="flex items-center gap-2 text-sm">
                  <FolderIcon className="w-4 h-4 text-blue-500" />
                  <span className="truncate">{folder.title}</span>
                </aside>
              </Link>
            ))}
          </div>
        </>
      )}

      {!!files.length && (
        <>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Files
          </h3>
          <div className="space-y-2">
            {files.map((file) => (
              <Link
                key={file.id}
                href={`/dashboard/${file.workspaceId}/${file.folderId}/${file.id}`}
                className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-muted/70"
              >
                <aside className="flex items-center gap-2 text-sm">
                  <FileIcon className="w-4 h-4 text-green-500" />
                  <span className="truncate">{file.title}</span>
                </aside>
              </Link>
            ))}
          </div>
        </>
      )}

      {!files.length && !folders.length && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground text-sm italic">
          No items in trash
        </div>
      )}
    </section>
  );
};

export default TrashRestore;
