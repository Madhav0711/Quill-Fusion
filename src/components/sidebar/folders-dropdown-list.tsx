'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { Folder } from '@/lib/supabase/supabase.types';
import React, { useEffect } from 'react';
import TooltipComponent from '../global/tooltip-component';
import { PlusIcon } from 'lucide-react';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { createFolder } from '@/lib/supabase/queries';
import { toast } from 'sonner';
import { v4 } from 'uuid';
import { Accordion } from '../ui/accordion';
import Dropdown from './dropdown';
import useSupabaseRealtime from '@/lib/hooks/useSupabaseRealtime';
import { useSubscriptionModal } from '@/lib/providers/subscription-modal-provider';

interface FoldersDropdownListProps {
    workspaceFolders: Folder[];
    workspaceId: string;
}

const FoldersDropdownList: React.FC<FoldersDropdownListProps> = ({
    workspaceFolders,
    workspaceId,
}) => {
    useSupabaseRealtime();
    const { state, dispatch, folderId } = useAppState();
    const { subscription } = useSupabaseUser();
    const { open, setOpen } = useSubscriptionModal();

    const folders = state.workspaces.find((ws) => ws.id === workspaceId)?.folders || [];

    useEffect(() => {
        if (workspaceFolders.length > 0) {
            dispatch({
                type: 'SET_FOLDERS',
                payload: {
                    workspaceId,
                    folders: workspaceFolders.map((folder) => ({
                        ...folder,
                        files: [],
                    })),
                },
            });
        }
    }, [workspaceFolders, workspaceId, dispatch]);

    const addFolderHandler = async () => {
        const activeFolders = folders.filter((folder) => !folder.in_trash);

        if (activeFolders.length >= 3 && !subscription) {
            toast.info('Limit Reached', {
                description: 'Please upgrade to a paid plan to create more folders.',
            });
            setOpen(true);
            return;
        }

        const newFolder: Folder = {
            data: null,
            id: v4(),
            created_at: new Date().toISOString(),
            title: 'Untitled Folder',
            icon_id: '📁',
            in_trash: null,
            workspace_id: workspaceId,
            banner_url: '',
        };

        dispatch({
            type: 'ADD_FOLDER',
            payload: { workspaceId, folder: { ...newFolder, files: [] } },
        });

        const { error } = await createFolder(newFolder);
        if (error) {
            toast.error('Error', {
                description: 'Could not create the folder',
            });
            dispatch({
                type: 'DELETE_FOLDER',
                payload: { workspaceId, folderId: newFolder.id },
            });
        } else {
            toast.success('Success', {
                description: 'Created folder.',
            });
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex sticky top-0 z-20 w-full h-10 group/title items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Folders
                </span>
                <TooltipComponent message="Create Folder">
                    <PlusIcon
                        onClick={addFolderHandler}
                        size={18}
                        className="hidden group-hover/title:inline-block cursor-pointer text-muted-foreground hover:text-primary transition-colors duration-200"
                    />
                </TooltipComponent>
            </div>

            {/* Folder List */}
            <div className="flex flex-col gap-y-1 text-sm">
                <Accordion
                    type="multiple"
                    defaultValue={[folderId || '']}
                    className="pb-20"
                >
                    {folders.length > 0 ? (
                        folders
                            .filter((folder) => !folder.in_trash)
                            .map((folder) => (
                                <Dropdown
                                    key={folder.id}
                                    title={folder.title}
                                    listType="folder"
                                    id={folder.id}
                                    iconId={folder.iconId}
                                />
                            ))
                    ) : (
                        <div className="flex items-center justify-center h-24 text-muted-foreground/70">
                            <p className="text-sm italic">No folders yet</p>
                        </div>
                    )}
                </Accordion>
            </div>
        </>
    );
};

export default FoldersDropdownList;
