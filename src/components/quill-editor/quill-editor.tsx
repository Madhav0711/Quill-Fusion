'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { File, Folder, workspace } from '@/lib/supabase/supabase.types';
import { useAppState } from '@/lib/providers/state-provider';
import 'quill/dist/quill.snow.css';
import { Button } from '../ui/button';
import { deleteFile, deleteFolder, findUser, getCollaborators, getFileDetails, getFolderDetails, getWorkspaceDetails, updateFile, updateFolder, updateWorkspace } from '@/lib/supabase/queries';
import { usePathname, useRouter } from 'next/navigation';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { createClient } from '@/util/supabase/client';
import Image from 'next/image';
import EmojiPicker from '../global/emoji-picker';
import BannerUpload from '../banner-upload/banner-upload';
import { XCircleIcon } from 'lucide-react';
import { useSocket } from '@/lib/providers/socket-provider';
import { normalizeFile } from '@/util/normalize';
import { toast } from 'sonner';
import { normalizeFolder, normalizeWorkspace } from '@/util/normalize';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';

interface QuillEditorProps {
    dirDetails: File | Folder | workspace;
    fileId: string;
    dirType: 'workspace' | 'folder' | 'file';
}

var TOOLBAR_OPTIONS = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],

    [{ header: 1 }, { header: 2 }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],

    [{ size: ['small', false, 'large', 'huge'] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],

    ['clean'],
];

const QuillEditor: React.FC<QuillEditorProps> = ({
    dirDetails,
    dirType,
    fileId,
}) => {

    const supabase = createClient();
    const { state, workspaceId, folderId, dispatch } = useAppState();
    const [quill, setQuill] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();
    const [collaborators, setCollaborators] = useState<
        { id: string; email: string; avatarUrl: string }[]
    >([]);
    const [saving, setSaving] = useState(false);
    const [deletingBanner, setDeletingBanner] = useState(false);
    const { socket, isConnected } = useSocket();
    const { user } = useSupabaseUser();
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [localCursors, setLocalCursors] = useState<any>([]);


    const wrapperRef = useCallback(async (wrapper: any) => {
        if (typeof window !== 'undefined') {
            if (wrapper === null) return;
            wrapper.innerHTML = '';
            const editor = document.createElement('div');
            wrapper.append(editor);
            const Quill = (await import('quill')).default;
            const QuillCursors = (await import('quill-cursors')).default;
            Quill.register('modules/cursors', QuillCursors);
            const q = new Quill(editor, {
                theme: 'snow',
                modules: {
                    toolbar: TOOLBAR_OPTIONS,
                    cursors: {
                        transformOnTextChange: true,
                    },
                },
            });
            setQuill(q);
        }
    }, []);

    const details = useMemo(() => {
        let selectedDir;
        if (dirType === 'file') {
            selectedDir = state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((folder) => folder.id === folderId)
                ?.files.find((file) => file.id === fileId);
        }
        if (dirType === 'folder') {
            selectedDir = state.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.folders.find((folder) => folder.id === fileId);
        }
        if (dirType === 'workspace') {
            selectedDir = state.workspaces.find(
                (workspace) => workspace.id === fileId
            );
        }

        if (selectedDir) {
            return selectedDir;
        }

        return {
            title: dirDetails.title,
            iconId: dirDetails.iconId,
            createdAt: dirDetails.createdAt,
            data: dirDetails.data,
            inTrash: dirDetails.inTrash,
            bannerUrl: dirDetails.bannerUrl,
        } as workspace | Folder | File;
    }, [state, workspaceId, folderId]);

    const restoreFileHandler = async () => {
        try {
            if (dirType === 'file') {
                if (!folderId || !workspaceId) return;

                dispatch({
                    type: 'UPDATE_FILE',
                    payload: { file: { inTrash: '' }, fileId, folderId, workspaceId },
                });

                const { data: serverRow, error } = await updateFile({ in_trash: '' }, fileId);
                if (error || !serverRow) {
                    dispatch({
                        type: 'UPDATE_FILE',
                        payload: { file: { inTrash: 'Deleted by ...' }, fileId, folderId, workspaceId },
                    });
                    toast.error('Error', { description: 'Could not restore file.' });
                    return;
                }

                const normalized = normalizeFile(serverRow);
                dispatch({
                    type: 'UPDATE_FILE',
                    payload: {
                        workspaceId,
                        folderId,
                        fileId: normalized.id,
                        file: normalized,
                    },
                });
                toast.success('Restored file.');
            }

            if (dirType === 'folder') {
                if (!workspaceId) return;

                dispatch({
                    type: 'UPDATE_FOLDER',
                    payload: { folder: { inTrash: '' }, folderId: fileId, workspaceId },
                });

                const { data: serverRow, error } = await updateFolder({ in_trash: '' }, fileId);
                if (error || !serverRow) {
                    dispatch({ type: 'UPDATE_FOLDER', payload: { folder: { inTrash: 'Deleted by ...' }, folderId: fileId, workspaceId } });
                    toast.error('Error', { description: 'Could not restore folder.' });
                    return;
                }

                const normalizedFolder = normalizeFolder(serverRow);

                dispatch({
                    type: 'UPDATE_FOLDER',
                    payload: { workspaceId, folderId: normalizedFolder.id, folder: normalizedFolder },
                });
                toast.success('Restored folder.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Unexpected error while restoring.');
        }
    };


    const deleteFileHandler = async () => {
        try {
            if (dirType === 'file') {
                if (!folderId || !workspaceId) return;

                dispatch({
                    type: 'DELETE_FILE',
                    payload: { fileId, folderId, workspaceId },
                });

                const { error } = await deleteFile(fileId);
                if (error) {
                    toast.error('Error deleting file. Please refresh.');
                    return;
                }

                toast.success('File deleted.');
                router.replace(`/dashboard/${workspaceId}`);
            }

            if (dirType === 'folder') {
                if (!workspaceId) return;

                dispatch({
                    type: 'DELETE_FOLDER',
                    payload: { folderId: fileId, workspaceId },
                });

                const { error } = await deleteFolder(fileId);
                if (error) {
                    toast.error('Error deleting folder. Please refresh.');
                    return;
                }

                toast.success('Folder deleted.');
                router.replace(`/dashboard/${workspaceId}`);
            }
        } catch (err) {
            console.error(err);
            toast.error('Unexpected error while deleting.');
        }
    };


    const breadCrumbs = useMemo(() => {
        if (!pathname || !state.workspaces || !workspaceId) return;
        const segments = pathname
            .split('/')
            .filter((val) => val !== 'dashboard' && val);
        const workspaceDetails = state.workspaces.find(
            (workspace) => workspace.id === workspaceId
        );
        const workspaceBreadCrumb = workspaceDetails
            ? `${workspaceDetails.title}`
            : '';
        if (segments.length === 1) {
            return workspaceBreadCrumb;
        }

        const folderSegment = segments[1];
        const folderDetails = workspaceDetails?.folders.find(
            (folder) => folder.id === folderSegment
        );
        const folderBreadCrumb = folderDetails
            ? `/${folderDetails.title}`
            : '';

        if (segments.length === 2) {
            return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
        }

        const fileSegment = segments[2];
        const fileDetails = folderDetails?.files.find(
            (file) => file.id === fileSegment
        );
        const fileBreadCrumb = fileDetails
            ? `/ ${fileDetails.title}`
            : '';

        return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
    }, [state, pathname, workspaceId]);

    const iconOnChange = async (icon: string) => {
        if (!fileId) return;

        try {
            if (dirType === 'workspace') {
                dispatch({
                    type: 'UPDATE_WORKSPACE',
                    payload: { workspace: { iconId: icon }, workspaceId: fileId },
                });

                const { data: serverRow, error } = await updateWorkspace({ icon_id: icon }, fileId);
                if (error || !serverRow) {
                    toast.error('Could not update workspace icon.');
                    return;
                }

                const normalizedWorkspace = normalizeWorkspace(serverRow)

                dispatch({
                    type: 'UPDATE_WORKSPACE',
                    payload: { workspace: normalizedWorkspace, workspaceId: normalizedWorkspace.id },
                });

                toast.success('Workspace icon updated.');
            }

            if (dirType === 'folder') {
                if (!workspaceId) return;

                dispatch({
                    type: 'UPDATE_FOLDER',
                    payload: { folder: { iconId: icon }, workspaceId, folderId: fileId },
                });

                const { data: serverRow, error } = await updateFolder({ icon_id: icon }, fileId);
                if (error || !serverRow) {
                    toast.error('Could not update folder icon.');
                    return;
                }

                const normalizedFolder = normalizeFolder(serverRow);
                if (!normalizedFolder) return;

                dispatch({
                    type: 'UPDATE_FOLDER',
                    payload: { folderId: normalizedFolder.id, workspaceId, folder: normalizedFolder },
                });

                toast.success('Folder icon updated.');
            }

            if (dirType === 'file') {
                if (!workspaceId || !folderId) return;

                dispatch({
                    type: 'UPDATE_FILE',
                    payload: { file: { iconId: icon }, workspaceId, folderId, fileId },
                });

                const { data: serverRow, error } = await updateFile({ icon_id: icon }, fileId);
                if (error || !serverRow) {
                    toast.error('Could not update file icon.');
                    return;
                }

                const normalized = normalizeFile(serverRow);
                if (!normalized) return;
                dispatch({
                    type: 'UPDATE_FILE',
                    payload: { workspaceId, folderId, fileId: normalized.id, file: normalized },
                });
                toast.success('File icon updated.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Unexpected error while updating icon.');
        }
    };


    const deleteBanner = async () => {
        if (!fileId) return;
        setDeletingBanner(true);
        try {
            if (dirType === 'file') {
                if (!folderId || !workspaceId) return;
                dispatch({
                    type: 'UPDATE_FILE',
                    payload: { file: { bannerUrl: '' }, fileId, folderId, workspaceId },
                });

                await supabase.storage.from('file-banners').remove([`banner-${fileId}`]);

                const { data: serverRow, error } = await updateFile({ banner_url: '' }, fileId);
                if (error || !serverRow) {
                    toast.error('Could not remove banner.');
                } else {
                    const normalized = normalizeFile(serverRow);
                    if (!normalized) return;
                    dispatch({
                        type: 'UPDATE_FILE',
                        payload: { workspaceId, folderId, fileId: normalized.id, file: normalized },
                    });
                    toast.success('Banner removed.');
                }
            }

            if (dirType === 'folder') {
                if (!workspaceId) return;
                dispatch({
                    type: 'UPDATE_FOLDER',
                    payload: { folder: { bannerUrl: '' }, folderId: fileId, workspaceId },
                });

                await supabase.storage.from('file-banners').remove([`banner-${fileId}`]);

                const { data: serverRow, error } = await updateFolder({ banner_url: '' }, fileId);
                if (error || !serverRow) {
                    toast.error('Could not remove banner from folder.');
                } else {
                    const normalizedFolder = normalizeFolder(serverRow);
                    if (!normalizedFolder) return;
                    dispatch({
                        type: 'UPDATE_FOLDER',
                        payload: { workspaceId, folderId: normalizedFolder.id, folder: normalizedFolder },
                    });
                    toast.success('Banner removed.');
                }
            }

            if (dirType === 'workspace') {
                dispatch({
                    type: 'UPDATE_WORKSPACE',
                    payload: { workspace: { bannerUrl: '' }, workspaceId: fileId },
                });

                await supabase.storage.from('file-banners').remove([`banner-${fileId}`]);

                const { data: serverRow, error } = await updateWorkspace({ banner_url: '' }, fileId);
                if (error || !serverRow) {
                    toast.error('Could not remove workspace banner.');
                } else {
                    const normalizedWorkspace = normalizeWorkspace(serverRow);
                    dispatch({ type: 'UPDATE_WORKSPACE', payload: { workspace: normalizedWorkspace, workspaceId: normalizedWorkspace.id } });
                    toast.success('Workspace banner removed.');
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('Unexpected error while removing banner.');
        } finally {
            setDeletingBanner(false);
        }
    };

    useEffect(() => {
        if (!fileId) return;
        let cancelled = false;

        const fetchInformation = async () => {
            try {
                if (dirType === 'file') {
                    const { data: serverRow, error } = await getFileDetails(fileId);
                    if (error || !serverRow) return router.replace('/dashboard');

                    if (cancelled) return;
                    const normalized = normalizeFile(serverRow);

                    // ensure we have the workspaceId context and the editor
                    if (!workspaceId || quill === null) return;
                    if (!normalized) return;

                    quill.setContents(JSON.parse(normalized.data));
                    dispatch({
                        type: 'UPDATE_FILE',
                        payload: {
                            file: normalized,
                            fileId: normalized.id,
                            folderId: normalized.folderId,
                            workspaceId: normalized.workspaceId ?? workspaceId,
                        },
                    });
                }

                if (dirType === 'folder') {
                    const { data: serverRow, error } = await getFolderDetails(fileId);
                    if (error || !serverRow) return router.replace('/dashboard');

                    if (cancelled) return;
                    const normalized = normalizeFolder(serverRow);

                    if (quill === null) return;
                    if (!normalized) return;

                    quill.setContents(JSON.parse(normalized.data));
                    dispatch({
                        type: 'UPDATE_FOLDER',
                        payload: {
                            folderId: normalized.id,
                            folder: normalized,
                            workspaceId: normalized.workspaceId,
                        },
                    });
                }

                if (dirType === 'workspace') {
                    const { data: serverRow, error } = await getWorkspaceDetails(fileId);
                    if (error || !serverRow) return router.replace('/dashboard');

                    if (cancelled) return;
                    const normalized = normalizeWorkspace(serverRow);

                    if (quill === null) return;
                    if (!normalized) return;

                    quill.setContents(JSON.parse(normalized.data));
                    dispatch({
                        type: 'UPDATE_WORKSPACE',
                        payload: {
                            workspace: normalized,
                            workspaceId: normalized.id,
                        },
                    });
                }
            } catch (err) {
                console.error('fetchInformation error', err);
                router.replace('/dashboard');
            }
        };

        fetchInformation();

        return () => {
            cancelled = true;
        };
    }, [fileId, workspaceId, quill, dirType, dispatch, router]);

    useEffect(() => {
        if (quill === null || socket === null || !fileId || !localCursors.length) return;

        const socketHandler = (range: any, roomId: string, cursorId: string) => {
            if (roomId === fileId) {
                const cursorToMove = localCursors.find(
                    (c: any) => c.cursors()?.[0].id === cursorId
                );
                if (cursorToMove) {
                    cursorToMove.moveCursor(cursorId, range);
                }
            }
        };

        socket.on('receive-cursor-move', socketHandler);
        return () => {
            socket.off('receive-cursor-move', socketHandler);
        };
    }, [quill, socket, fileId, localCursors]);

    // rooms: ensure join (emit create-room on connect/join)
    // Rooms: ensure join on fileId change or socket reconnect
    useEffect(() => {
        if (!socket || !fileId) return;

        let prevFileId: string | null = null;

        const joinRoom = () => {
            // Leave old room if switching files
            if (prevFileId && prevFileId !== fileId) {
                socket.emit('leave-room', prevFileId);
                console.log('[client] leave-room emitted', { prevFileId, socketId: socket.id });
            }

            socket.emit('create-room', fileId);
            console.log('[client] create-room emitted', { fileId, socketId: socket.id });

            prevFileId = fileId;
        };

        // Join immediately if connected
        if (socket.connected) {
            joinRoom();
        }

        // Rejoin when socket reconnects
        socket.on('connect', joinRoom);

        return () => {
            socket.off('connect', joinRoom);
            // Optionally leave on cleanup if you want
            if (prevFileId) {
                socket.emit('leave-room', prevFileId);
            }
        };
    }, [socket, fileId]);


    // Send quill changes to all clients and persist (with normalized server responses)
    useEffect(() => {
        if (quill === null || socket === null || !fileId || !user) return;

        let cancelled = false;

        const selectionChangeHandler = (cursorId: string) => {
            return (range: any, oldRange: any, source: any) => {
                if (source === 'user' && cursorId) {
                    socket.emit('send-cursor-move', range, fileId, cursorId);
                }
            };
        };

        const quillHandler = (delta: any, oldDelta: any, source: any) => {
            if (source !== 'user') return;

            console.log('[CLIENT] User typed. Emitting send-changes to room:', fileId);

            // debounce saving to DB
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            setSaving(true);

            // immediate broadcast of incremental change
            console.log(`[CLIENT] Quill change detected. Sending... fileId=${fileId}`, delta);
            socket.emit('send-changes', delta, fileId);

            // schedule snapshot save
            saveTimerRef.current = setTimeout(async () => {
                try {
                    const contents = quill.getContents();
                    const quillLength = quill.getLength();
                    if (!contents || quillLength <= 1) {
                        if (!cancelled) setSaving(false);
                        return;
                    }

                    const payload = { data: JSON.stringify(contents) };

                    if (dirType === 'workspace') {
                        // optimistic local update
                        dispatch({
                            type: 'UPDATE_WORKSPACE',
                            payload: { workspace: { data: payload.data }, workspaceId: fileId },
                        });

                        // persist and normalize server canonical row
                        const { data: serverRow, error } = await updateWorkspace({ data: payload.data }, fileId);
                        if (!error && serverRow) {
                            const normalized = normalizeWorkspace(serverRow);
                            dispatch({
                                type: 'UPDATE_WORKSPACE',
                                payload: { workspace: normalized, workspaceId: normalized.id },
                            });
                        }
                    } else if (dirType === 'folder') {
                        if (!workspaceId) {
                            if (!cancelled) setSaving(false);
                            return;
                        }

                        dispatch({
                            type: 'UPDATE_FOLDER',
                            payload: { folderId: fileId, folder: { data: payload.data }, workspaceId },
                        });

                        const { data: serverRow, error } = await updateFolder({ data: payload.data }, fileId);
                        if (!error && serverRow) {
                            const normalizedFolder = normalizeFolder(serverRow);
                            dispatch({
                                type: 'UPDATE_FOLDER',
                                payload: { folderId: normalizedFolder.id, folder: normalizedFolder, workspaceId: normalizedFolder.workspaceId },
                            });
                        }
                    } else if (dirType === 'file') {
                        if (!workspaceId || !folderId) {
                            if (!cancelled) setSaving(false);
                            return;
                        }

                        dispatch({
                            type: 'UPDATE_FILE',
                            payload: { file: { data: payload.data }, workspaceId, folderId: folderId, fileId },
                        });

                        const { data: serverRow, error } = await updateFile({ data: payload.data }, fileId);
                        if (!error && serverRow) {
                            const normalized = normalizeFile(serverRow);
                            dispatch({
                                type: 'UPDATE_FILE',
                                payload: { workspaceId, folderId: normalized.folderId ?? folderId, fileId: normalized.id, file: normalized },
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error saving editor contents', err);
                } finally {
                    if (!cancelled) setSaving(false);
                }
            }, 850);
        };

        // attach handlers
        quill.on('text-change', quillHandler);
        quill.on('selection-change', selectionChangeHandler(user.id));

        // cleanup
        return () => {
            cancelled = true;
            quill.off('text-change', quillHandler);
            quill.off('selection-change', selectionChangeHandler(user.id));
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }
        };
    }, [quill, socket, fileId, user, dirType, workspaceId, folderId, dispatch]);

    // Receive deltas from server and apply
    useEffect(() => {
        if (quill === null || socket === null) return;

        const socketHandler = (deltas: any, id: string) => {
            console.log(`[CLIENT] Received 'receive-changes' event. Event ID: ${id}. My current fileId: ${fileId}`);
            if (id !== fileId) return;
            try {
                quill.updateContents(deltas);
            } catch (err) {
                console.error('Failed to apply remote delta', err);
            }
        };

        socket.on('receive-changes', socketHandler);
        return () => {
            socket.off('receive-changes', socketHandler);
        };
    }, [quill, socket, fileId]);

    // Presence using Supabase real-time presence (unchanged, normalizes only user avatar url retrieval)
    useEffect(() => {
        if (!fileId || quill === null) return;

        const room = supabase.channel(fileId);
        const subscription = room
            .on('presence', { event: 'sync' }, () => {
                const newState = room.presenceState();
                const newCollaborators = Object.values(newState).flat() as any;
                setCollaborators(newCollaborators);

                if (user) {
                    const allCursors: any = [];
                    newCollaborators.forEach((collaborator: { id: string; email: string; avatar: string }) => {
                        if (collaborator.id !== user.id) {
                            const userCursor = quill.getModule('cursors');
                            userCursor.createCursor(
                                collaborator.id,
                                collaborator.email.split('@')[0],
                                `#${Math.random().toString(16).slice(2, 8)}`
                            );
                            allCursors.push(userCursor);
                        }
                    });
                    setLocalCursors(allCursors);
                }
            })
            .subscribe(async (status) => {
                if (status !== 'SUBSCRIBED' || !user) return;
                const response = await findUser(user.id);
                if (!response) return;

                room.track({
                    id: user.id,
                    email: user.email?.split('@')[0],
                    avatarUrl: response.avatarUrl
                        ? supabase.storage.from('avatars').getPublicUrl(response.avatarUrl).data.publicUrl
                        : '',
                });
            });

        return () => {
            supabase.removeChannel(room);
        };
    }, [fileId, quill, supabase, user]);

    // debug: show all events coming to this client socket
    useEffect(() => {
        if (!socket) return;
        socket.onAny((event: any, ...args: any) => {
            console.log(`[CLIENT][ONANY] socket=${socket.id} event=${event}`, args);
        });
        return () => {
            socket.offAny?.();
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        const handler = (roomId: string) => {
            console.log(`[CLIENT] Received PONG for ${roomId}`);
        };
        socket.on('pong', handler);
        return () => socket.off('pong', handler);
    }, [socket]);

    const testPing = () => {
        if (!socket || !fileId) {
            console.warn('socket or fileId missing');
            return;
        }
        console.log(`🔵 [CLIENT] SENT PING to room ${fileId} (socketId=${socket.id}, connected=${socket.connected})`);
        socket.emit('ping', fileId, (ack: any) => {
            console.log('[CLIENT] ping ack', ack);
        });
    };


    return (
        <>
            <button onClick={testPing} style={{position:'fixed', top:100, right:20, zIndex:1000}}>Test Ping</button>


            {isConnected ? "connected" : 'not connected'}
            <div className="relative">
                {details.inTrash && (
                    <article className="py-2 z-40 bg-[#EB5757] flex  md:flex-row flex-col justify-center items-center gap-4 flex-wrap">
                        <div
                            className="flex flex-col md:flex-row gap-2 justify-center items-center">
                            <span className="text-white">
                                This {dirType} is in the trash.
                            </span>
                            <Button size="sm" variant="outline" className="bg-transparent border-white text-whitehover:bg-whitehover:text-[#EB5757]"
                                onClick={restoreFileHandler}>
                                Restore
                            </Button>

                            <Button size="sm" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-[#EB5757]"
                                onClick={deleteFileHandler}>
                                Delete
                            </Button>
                        </div>
                        <span className="text-sm text-white">{details.inTrash}</span>
                    </article>
                )}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between justify-center sm:items-center sm:p-2 p-8">
                    <div>{breadCrumbs}</div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10">
                            {collaborators?.map((collaborator) => (
                                <TooltipProvider key={collaborator.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Avatar className="-ml-3 bg-background border-2 flex items-center justify-center border-white h-8 w-8 rounded-full">
                                                <AvatarImage
                                                    src={
                                                        collaborator.avatarUrl ? collaborator.avatarUrl : ''
                                                    }
                                                    className="rounded-full"
                                                />
                                                <AvatarFallback>
                                                    {collaborator.email.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>{collaborator.email}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                        {saving ? (
                            <Badge
                                variant="secondary"
                                className="bg-orange-600 top-4 text-white right-4 z-50">
                                Saving...
                            </Badge>
                        ) : (
                            <Badge
                                variant="secondary"
                                className="bg-emerald-600 top-4 text-white right-4 z-50">
                                Saved
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
            {details.banner_url && (
                <div className="relative w-full h-[200px]">
                    <Image
                        src={
                            supabase.storage
                                .from('file-banners')
                                .getPublicUrl(details.banner_url).data.publicUrl
                        }
                        fill className="w-full md:h-48 h-20 object-cover" alt="Banner Image"
                    />
                </div>
            )}
            <div className='flex justify-center items-center flex-col mt-2 relative'>
                <div
                    className="w-full self-center max-w-[800px] flex flex-col px-7 lg:my-8">
                    {/*
                    <div className="text-[80px]">
                        <EmojiPicker getValue={iconOnChange}>
                            <div
                                className="w-[100px] cursor-pointer transition-colors h-[100px] flex items-center justify-center hover:bg-muted rounded-xl"
                            >
                                {details.iconId}
                            </div>
                        </EmojiPicker>
                    </div>
                        */}
                    <div className="flex ">
                        <BannerUpload
                            id={fileId}
                            dirType={dirType}
                            className="mt-2 text-sm text-muted-foreground p-2 hover:text-card-foreground transition-all rounded-md">
                            {details.bannerUrl ? 'Update Banner' : 'Add Banner'}
                        </BannerUpload>
                        {details.bannerUrl && (
                            <Button
                                disabled={deletingBanner}
                                onClick={deleteBanner}
                                variant="ghost"
                                className="gap-2 hover:bg-background flex item-center justify-center mt-2 text-sm text-muted-foreground w-36 p-2 rounded-md">
                                <span className="whitespace-nowrap font-normal">
                                    Remove Banner
                                </span>
                            </Button>
                        )}
                    </div>
                    <span
                        className="text-muted-foreground text-3xl font-bold h-9">
                        {details.title}
                    </span>
                    <span className="text-muted-foreground text-sm">
                        {dirType.toUpperCase()}
                    </span>
                </div>
                <div
                    id="container"
                    className="max-w-[850px]"
                    ref={wrapperRef}
                ></div>
            </div>
        </>
    );
};

export default QuillEditor;