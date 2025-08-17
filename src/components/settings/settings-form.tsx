'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppState } from '@/lib/providers/state-provider';
import { User } from '@/lib/supabase/supabase.types';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/util/supabase/client';
import {
    Briefcase, CreditCard, ExternalLink, Lock, LogOut,
    Plus, Share, User as UserIcon
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
    addCollaborators, deleteWorkspace, getCollaborators,
    removeCollaborators, updateWorkspace
} from '@/lib/supabase/queries';
import { v4 } from 'uuid';
import {
    Select, SelectContent, SelectGroup, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import CollaboratorSearch from '../global/collaborator-search';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import LogoutButton from '../global/logout-button';
import Link from 'next/link';
import { toast } from 'sonner';
import HomeIcon from '../icons/homeIcon';
import { useSubscriptionModal } from '@/lib/providers/subscription-modal-provider';

const SettingsForm = () => {
    const { user, subscription } = useSupabaseUser();
    const router = useRouter();
    const supabase = createClient();
    const { state, workspaceId, dispatch } = useAppState();
    const [permissions, setPermissions] = useState('private');
    const [collaborators, setCollaborators] = useState<User[]>([]);
    const [openAlertMessage, setOpenAlertMessage] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [loadingPortal, setLoadingPortal] = useState(false);
    const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { open, setOpen } = useSubscriptionModal();

    const workspaceDetails = state.workspaces.find(ws => ws.id === workspaceId);

    const addCollaborator = async (profile: User) => {
        if (!workspaceId) return;
        const { error } = await addCollaborators([profile], workspaceId);
        if (error) return toast.error('Error', { description: 'Could not add collaborator.' });
        setCollaborators([...collaborators, profile]);
    };

    const removeCollaborator = async (user: User) => {
        if (!workspaceId) return;
        const { error } = await removeCollaborators([user], workspaceId);
        if (error) return toast.error('Error', { description: 'Could not remove collaborator.' });
        if (collaborators.length === 1) setPermissions('private');
        setCollaborators(prev => prev.filter(c => c.id !== user.id));
    };

    const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!workspaceId || !e.target.value) return;
        dispatch({ type: 'UPDATE_WORKSPACE', payload: { workspace: { title: e.target.value }, workspaceId } });
        if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
        titleTimerRef.current = setTimeout(async () => {
            await updateWorkspace({ title: e.target.value }, workspaceId);
        }, 500);
    };

    const onChangeWorkspaceLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!workspaceId) return;
        const file = e.target.files?.[0];
        if (!file) return;
        const uuid = v4();
        setUploadingLogo(true);
        const { data, error } = await supabase.storage.from('workspace-logos').upload(`workspaceLogo.${uuid}`, file, {
            cacheControl: '3600', upsert: true,
        });
        if (!error) {
            dispatch({ type: 'UPDATE_WORKSPACE', payload: { workspace: { logo: data.path }, workspaceId } });
            await updateWorkspace({ logo: data.path }, workspaceId);
        } else toast.error('Error', { description: 'Could not upload workspace logo.' });
        setUploadingLogo(false);
    };

    const onPermissionsChange = (val: string) => {
        if (val === 'private') setOpenAlertMessage(true);
        else setPermissions(val);
    };

    const onClickAlertConfirm = async () => {
        if (!workspaceId) return;
        if (collaborators.length > 0) {
            await removeCollaborators(collaborators, workspaceId);
            setCollaborators([]);
        }
        setPermissions('private');
        setOpenAlertMessage(false);
    };

    useEffect(() => {
        if (!workspaceId) return;
        const fetchCollaborators = async () => {
            const { data, error } = await getCollaborators(workspaceId);
            if (error) return;
            if (data.length) {
                setPermissions('shared');
                setCollaborators(data);
            }
        };
        fetchCollaborators();
    }, [workspaceId, getCollaborators]);

    return (
        <div className="flex flex-col gap-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50 backdrop-blur-md">
            <p className="flex items-center gap-2 text-cyan-400 text-lg font-semibold"><Briefcase size={16} /> Workspace</p>
            <Separator className="bg-cyan-500/30" />

            <div className="flex flex-col gap-3">
                <Label htmlFor="workspaceName" className="text-sm text-slate-400">
                    Name
                </Label>
                <Input name="workspaceName" value={workspaceDetails ? workspaceDetails.title : ''}
                    placeholder="Workspace Name" onChange={workspaceNameChange}
                    className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500" />
                <Label htmlFor="workspaceLogo" className="text-sm text-slate-400">
                    Workspace Logo
                </Label>
                <Input name="workspaceLogo" type="file" accept="image/*"
                    onChange={onChangeWorkspaceLogo} disabled={uploadingLogo || subscription?.status !== 'active'}
                    className="bg-slate-800 border-slate-700 text-slate-200 file:text-cyan-400 hover:file:text-cyan-300" />
                {subscription?.status !== 'active' && <small className="text-slate-500">To customize your workspace, you need to be on a Pro Plan</small>}
            </div>

            <Label htmlFor="permissions" className="text-slate-300">Permissions</Label>
            <Select onValueChange={onPermissionsChange} value={permissions}>
                <SelectTrigger className="w-full h-10 bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border border-slate-700 text-slate-200 shadow-xl">
                    <SelectGroup>
                        <SelectItem value="private"><div className="p-2 flex gap-3 items-center">
                            <Lock size={16} className="text-cyan-400" />
                            <article className="flex flex-col text-slate-300">
                                <span>Private</span>
                                <p className="text-xs text-slate-500">
                                    Only you can access this workspace.
                                </p>
                            </article>
                        </div></SelectItem>
                        <SelectItem value="shared">
                            <div className="p-2 flex gap-3 items-center">
                                <Share size={16} className="text-cyan-400" />
                                <article className="flex flex-col text-slate-300">
                                    <span>Shared</span>
                                    <p className="text-xs text-slate-500">
                                        Invite collaborators.
                                    </p>
                                </article>
                            </div>
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            {permissions === 'shared' && (
                <div>
                    <CollaboratorSearch existingCollaborators={collaborators} getCollaborator={addCollaborator}>
                        <Button type="button" className="text-sm mt-4 flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white"><Plus size={16} />
                            Add Collaborators
                        </Button>
                    </CollaboratorSearch>
                    <div className="mt-4">
                        <span className="text-sm text-slate-400">Collaborators {collaborators.length}</span>
                        <ScrollArea className="h-[120px] w-full rounded-md border border-slate-700">
                            {collaborators.length ? collaborators.map((c) => (
                                <div className="p-4 flex justify-between items-center border-b border-slate-700" key={c.id}>
                                    <div className="flex gap-3 items-center">
                                        <Avatar>
                                            <AvatarImage src={c.avatarUrl || ''} />
                                            <AvatarFallback>
                                                {c.email.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm text-slate-300 truncate sm:w-[300px] w-[140px]">{c.email}</div>
                                    </div>
                                    <Button variant="secondary" onClick={() => removeCollaborator(c)} className="bg-slate-700 hover:bg-slate-600">
                                        Remove
                                    </Button>
                                </div>
                            )) : <div className="flex justify-center items-center h-full text-slate-500">You have no collaborators</div>}
                        </ScrollArea>
                    </div>
                </div>
            )}

            <Alert variant="destructive" className="flex flex-col gap-4 items-start p-4 bg-gradient-to-r from-red-800/70 to-red-600/70 border border-red-500/40 shadow-lg">
                <AlertDescription className="text-sm text-red-200">
                    Warning! Deleting your workspace will permanently delete all data related to it.
                </AlertDescription>
                <Button type="button" size="sm" variant="destructive" className="text-sm bg-red-600 hover:bg-red-500 border-2 border-red-400" onClick={async () => {
                    if (!workspaceId) return;
                    const { error } = await deleteWorkspace(workspaceId);
                    if (error) toast.error('Error', { description: 'Could not delete workspace.' });
                    else {
                        toast.success('Success', { description: 'Successfully deleted your workspace' });
                        dispatch({ type: 'DELETE_WORKSPACE', payload: workspaceId });
                        router.replace('/dashboard');
                    }
                }}>Delete Workspace</Button>
            </Alert>

            <p className="flex items-center gap-2 text-cyan-400 text-lg font-semibold"><UserIcon size={16} /> Profile</p>
            <Separator className="bg-cyan-500/30" />

            <div className="flex items-center gap-6">
                <Avatar>
                    <AvatarImage src={''} />
                    <AvatarFallback><HomeIcon />
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <small className="text-slate-500">{user ? user.email : ''}</small>
                    <Label htmlFor="profilePicture" className="text-sm text-slate-400">
                        Profile Picture
                    </Label>
                    <Input name="profilePicture" type="file" accept="image/*" className="bg-slate-800 border-slate-700 text-slate-200 file:text-cyan-400" />
                </div>
            </div>

            <LogoutButton>
                <div className="flex items-center text-red-400 hover:text-red-300">
                    <LogOut size={16} />
                </div>
            </LogoutButton>

            <p className="flex items-center gap-2 text-cyan-400 text-lg font-semibold">
                <CreditCard size={16} />
                Billing & Plan
            </p>
            <Separator className="bg-cyan-500/30" />
            <p className="text-slate-400">
                You are currently on a {subscription?.status === 'active' ? 'Pro' : 'Free'}
                Plan</p>
            <Link href="/" target="_blank" className="text-slate-300 hover:text-cyan-400 flex items-center gap-2">
                View Plans
                <ExternalLink size={16} />
            </Link>
            {subscription?.status === 'active'
                ? <Button type="button" size="sm" variant="secondary" disabled={loadingPortal} className="bg-slate-700 hover:bg-slate-600 text-white"
                //onClick={redirectToCustomerPortal}
                >
                    Manage Subscription
                </Button>
                : <Button type="button" size="sm" variant="secondary" className="bg-cyan-600 hover:bg-cyan-500 text-white" onClick={() => setOpen(true)}>
                    Start Plan
                </Button>}

            <AlertDialog open={openAlertMessage}>
                <AlertDialogContent className="bg-slate-900 border border-slate-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-200">
                            Are you sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Changing a Shared workspace to Private will remove all collaborators permanently.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setOpenAlertMessage(false)} className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onClickAlertConfirm} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SettingsForm;
