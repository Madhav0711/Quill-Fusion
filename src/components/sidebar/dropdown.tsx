'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useAppState } from '@/lib/providers/state-provider';
import { useRouter } from 'next/navigation';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import clsx from 'clsx';
import EmojiPicker from '../global/emoji-picker';
import {
  createFile,
  updateFile,
  updateFolder,
  deleteFile as deleteFileQuery,
} from '@/lib/supabase/queries';
import TooltipComponent from '../global/tooltip-component';
import { PlusIcon, Trash } from 'lucide-react';
import { File } from '@/lib/supabase/supabase.types';
import { v4 } from 'uuid';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { toast } from 'sonner';
import { normalizeFile } from '@/util/normalize';

interface DropdownProps {
  title: string;
  id: string;
  listType: 'folder' | 'file';
  iconId: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  title,
  id,
  listType,
  iconId,
  children,
  disabled,
  ...props
}) => {
  const { user } = useSupabaseUser();
  const { state, dispatch, workspaceId, folderId } = useAppState();
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // store original title so we can revert if server update fails
  const originalTitleRef = useRef<string | null>(null);

  // folder Title (canonical: prefer state, fallback to prop)
  const folderTitle: string | undefined = useMemo(() => {
    if (listType === 'folder') {
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === id)?.title;
      if (title === stateTitle || !stateTitle) return title;
      return stateTitle;
    }
    return undefined;
  }, [state, listType, workspaceId, id, title]);

  // file title (we use the composite id format: `${folderId}folder${fileId}`)
  const fileTitle: string | undefined = useMemo(() => {
    if (listType === 'file') {
      const fileAndFolderId = id.split('folder');
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === fileAndFolderId[0])
        ?.files.find((file) => file.id === fileAndFolderId[1])?.title;
      if (title === stateTitle || !stateTitle) return title;
      return stateTitle;
    }
    return undefined;
  }, [state, listType, workspaceId, id, title]);

  // navigate
  const navigatatePage = (accordionId: string, type: string) => {
    if (type === 'folder') {
      router.push(`/dashboard/${workspaceId}/${accordionId}`);
    }
    if (type === 'file') {
      router.push(
        `/dashboard/${workspaceId}/${folderId}/${accordionId.split('folder')[1]}`
      );
    }
  };

  // start editing -> capture original title
  const handleDoubleClick = () => {
    // capture original title to revert if server update fails
    originalTitleRef.current = listType === 'folder' ? folderTitle ?? title : fileTitle ?? title;
    setIsEditing(true);
  };

  // finish editing -> persist to server (optimistic already done via onChange handlers)
  const handleBlur = async () => {
    if (!isEditing) return;
    setIsEditing(false);

    const fId = id.split('folder');

    // Folder rename
    if (fId?.length === 1 && listType === 'folder') {
      const newTitle = folderTitle ?? title;
      const oldTitle = originalTitleRef.current ?? title;
      if (!newTitle || newTitle === oldTitle) return;

      // server update
      const { error } = await updateFolder({ title: newTitle }, fId[0]);
      if (error) {
        // revert optimistic
        dispatch({
          type: 'UPDATE_FOLDER',
          payload: {
            workspaceId,
            folderId: fId[0],
            folder: { title: oldTitle },
          },
        });
        toast.error('Error', { description: 'Could not update folder title.' });
      } else {
        toast.success('Success', { description: 'Folder title changed.' });
      }
      return;
    }

    // File rename
    if (fId.length === 2 && fId[1] && listType === 'file') {
      const newTitle = fileTitle ?? title;
      const oldTitle = originalTitleRef.current ?? title;
      if (!newTitle || newTitle === oldTitle) return;

      const { data, error } = await updateFile({ title: newTitle }, fId[1]);
      if (error) {
        // revert optimistic
        if (!workspaceId || !folderId) return;
        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            workspaceId,
            folderId,
            fileId: fId[1],
            file: { title: oldTitle },
          },
        });
        toast.error('Error', { description: 'Could not update file title.' });
      } else {
        toast.success('Success', { description: 'File title changed.' });
      }
      return;
    }
  };

  // emoji change for folder
  const onChangeEmoji = async (selectedEmoji: string) => {
    if (!workspaceId) return;
    if (listType === 'folder') {
      // optimistic
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          workspaceId,
          folderId: id,
          folder: { iconId: selectedEmoji },
        },
      });

      const { data, error } = await updateFolder({ iconId: selectedEmoji }, id);
      if (error) {
        toast.error('Error', { description: 'Could not update emoji for folder.' });
      } else {
        toast.success('Success', { description: 'Emoji updated.' });
      }
    }
  };

  // local optimistic title changes while typing
  const folderTitleChange = (e: any) => {
    if (!workspaceId) return;
    const fid = id.split('folder');
    if (fid.length === 1) {
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          folder: { title: e.target.value },
          folderId: fid[0],
          workspaceId,
        },
      });
    }
  };

  const fileTitleChange = (e: any) => {
    if (!workspaceId || !folderId) return;
    const fid = id.split('folder');
    if (fid.length === 2 && fid[1]) {
      dispatch({
        type: 'UPDATE_FILE',
        payload: {
          file: { title: e.target.value },
          folderId,
          workspaceId,
          fileId: fid[1],
        },
      });
    }
  };

  // move to trash (optimistic & server). Also provide a permanent delete helper below.
  const moveToTrash = async (e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    if (!user?.email || !workspaceId) return;
    const pathId = id.split('folder');

    // FOLDER -> mark inTrash
    if (listType === 'folder' && pathId[0]) {
      dispatch({
        type: 'UPDATE_FOLDER',
        payload: {
          folder: { inTrash: `Deleted by ${user?.email}` },
          folderId: pathId[0],
          workspaceId,
        },
      });

      const { data, error } = await updateFolder({ in_trash: `Deleted by ${user?.email}` }, pathId[0]);
      if (error) {
        // revert
        dispatch({
          type: 'UPDATE_FOLDER',
          payload: {
            folder: { inTrash: null },
            folderId: pathId[0],
            workspaceId,
          },
        });
        toast.error('Error', { description: 'Could not move the folder to trash' });
      } else {
        toast.success('Success', { description: 'Moved folder to trash' });
      }
      return;
    }

    // FILE -> mark inTrash
    if (listType === 'file' && pathId[1]) {
      dispatch({
        type: 'UPDATE_FILE',
        payload: {
          file: { inTrash: `Deleted by ${user?.email}` },
          folderId: pathId[0],
          workspaceId,
          fileId: pathId[1],
        },
      });

      const { data, error } = await updateFile({ in_trash: `Deleted by ${user?.email}` }, pathId[1]);
      if (error) {
        // revert
        dispatch({
          type: 'UPDATE_FILE',
          payload: {
            file: { inTrash: null },
            folderId: pathId[0],
            workspaceId,
            fileId: pathId[1],
          },
        });
        toast.error('Error', { description: 'Could not move the file to trash' });
      } else {
        toast.success('Success', { description: 'Moved file to trash' });
      }
      return;
    }
  };

  // permanently delete file (optional helper)
  const permanentlyDeleteFile = async (fileIdToDelete: string) => {
    if (!workspaceId || !folderId) return;
    // optimistic remove
    dispatch({
      type: 'DELETE_FILE',
      payload: { fileId: fileIdToDelete, folderId, workspaceId },
    });

    const { error } = await deleteFileQuery(fileIdToDelete);
    if (error) {
      toast.error('Error', { description: 'Could not delete file.' });
      // Optionally re-fetch or revert (requires having the original file object)
      // For simplicity, we can re-fetch workspace/folder data or show an error asking user to refresh.
    } else {
      toast.success('File deleted.');
      // if currently viewing that file, navigate away
      const currentPathFileId = id.split('folder')[1];
      if (currentPathFileId === fileIdToDelete) {
        router.replace(`/dashboard/${workspaceId}/${folderId}`);
      }
    }
  };

  const isFolder = listType === 'folder';
  const groupIdentifies = clsx(
    'dark:text-white whitespace-nowrap flex justify-between items-center w-full relative',
    {
      'group/folder': isFolder,
      'group/file': !isFolder,
    }
  );

  const listStyles = useMemo(
    () =>
      clsx('relative', {
        'border-none text-md': isFolder,
        'border-none ml-6 text-[16px] py-1': !isFolder,
      }),
    [isFolder]
  );

  const hoverStyles = useMemo(
    () =>
      clsx(
        'h-full hidden rounded-sm absolute right-0 items-center justify-center',
        {
          'group-hover/file:block': listType === 'file',
          'group-hover/folder:block': listType === 'folder',
        }
      ),
    [isFolder]
  );

  // addNewFile: optimistic + reconcile (you already had this logic, kept intact)
  const addNewFile = async (e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    if (!workspaceId) return;

    // DB-shaped payload for Supabase
    const dbFile: File = {
      folder_id: id,
      data: null,
      created_at: new Date().toISOString(),
      in_trash: null,
      title: 'Untitled File',
      icon_id: '📄',
      id: v4(), // generate id client-side so we can optimistically render
      workspace_id: workspaceId,
      banner_url: '',
    };

    // Local (camelCase) object for your reducer/UI
    const localFile = {
      id: dbFile.id,
      title: dbFile.title,
      folderId: dbFile.folder_id,
      workspaceId: dbFile.workspace_id,
      iconId: dbFile.icon_id,
      createdAt: dbFile.created_at,
      inTrash: dbFile.in_trash,
      bannerUrl: dbFile.banner_url,
      data: dbFile.data,
    };

    // Optimistic update: add to state immediately
    dispatch({
      type: 'ADD_FILE',
      payload: { file: localFile, folderId: id, workspaceId },
    });

    // Call server and get the inserted row back
    const { data: returned, error } = await createFile(dbFile);

    if (error || !returned) {
      // revert optimistic update
      dispatch({
        type: 'DELETE_FILE',
        payload: { fileId: localFile.id, folderId: id, workspaceId },
      });
      toast.error('Error', { description: 'Could not create a file' });
      return;
    }

    // normalize server row and update client state
    const serverFile = normalizeFile(returned);

    // If the server generated a different id (unlikely because we provided one),
    // replace; otherwise just update the entry with canonical server values.
    if (serverFile.id !== localFile.id) {
      dispatch({
        type: 'REPLACE_FILE_ID',
        payload: {
          workspaceId,
          folderId: id,
          oldId: localFile.id,
          file: serverFile,
        },
      });
    } else {
      dispatch({
        type: 'UPDATE_FILE',
        payload: {
          workspaceId,
          folderId: id,
          fileId: serverFile.id,
          file: serverFile,
        },
      });
    }

    toast.success('Success', { description: 'File created.' });
  };

  return (
    <AccordionItem
      value={id}
      className={listStyles}
      onClick={(e) => {
        e.stopPropagation();
        navigatatePage(id, listType);
      }}
    >
      <AccordionTrigger
        id={listType}
        className="hover:no-underline px-3 py-2 dark:text-muted-foreground text-sm rounded-lg transition-colors hover:bg-muted/30"
        disabled={listType === 'file'}
      >
        <div className={groupIdentifies}>
          {/* Left side: emoji + title */}
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <EmojiPicker getValue={onChangeEmoji}>{iconId}</EmojiPicker>
            </div>

            <input
              type="text"
              value={listType === 'folder' ? folderTitle ?? title : fileTitle ?? title}
              className={clsx(
                'outline-none overflow-hidden truncate text-sm w-[160px]',
                {
                  'bg-muted/40 cursor-text px-1.5 py-0.5 rounded-md': isEditing,
                  'bg-transparent cursor-pointer': !isEditing,
                }
              )}
              readOnly={!isEditing}
              onDoubleClick={handleDoubleClick}
              onBlur={handleBlur}
              onChange={listType === 'folder' ? folderTitleChange : fileTitleChange}
            />
          </div>

          {/* Right side: hover actions */}
          <div className={hoverStyles}>
            <TooltipComponent message="Delete">
              <Trash
                onClick={moveToTrash}
                size={16}
                className="mx-1 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
              />
            </TooltipComponent>

            {listType === 'folder' && !isEditing && (
              <TooltipComponent message="Add File">
                <PlusIcon
                  onClick={addNewFile}
                  size={16}
                  className="mx-1 text-muted-foreground hover:text-green-500 transition-colors cursor-pointer"
                />
              </TooltipComponent>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pl-6 space-y-1">
        {state.workspaces
          .find((workspace) => workspace.id === workspaceId)
          ?.folders.find((folder) => folder.id === id)
          ?.files.filter((file) => !(file.inTrash ?? file.in_trash))
          .map((file) => {
            const customFileId = `${id}folder${file.id}`;
            return (
              <Dropdown
                key={file.id}
                title={file.title}
                listType="file"
                id={customFileId}
                iconId={file.iconId}
              />
            );
          })}
      </AccordionContent>
    </AccordionItem>

  );
};

export default Dropdown;
