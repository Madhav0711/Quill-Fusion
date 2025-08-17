'use server';

import { createClient } from '@/util/supabase/server';
import { revalidatePath } from 'next/cache';
import { normalizeUser } from '@/util/normalize';
import { validate } from 'uuid';
import {
  File,
  Folder,
  Subscription,
  User,
  workspace,
  ProductWithPrice,
} from './supabase.types';

// NOTE: This file now uses the Supabase JS client for all database operations.
// Column names must match your database exactly (e.g., 'workspace_owner').

export const createWorkspace = async (workspace: workspace) => {
  const supabase = await createClient();
  try {
    // We use the Supabase client, not Drizzle (db)
    const { data, error } = await supabase.from('workspaces').insert(workspace);

    if (error) {
      console.log('CREATE WORKSPACE ERROR:', error);
      // IMPORTANT: Return the error if one occurs
      return { data: null, error: 'Error creating workspace.' };
    }

    // Only return success if there was no error
    return { data, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'An unexpected error occurred.' };
  }
};

export const deleteWorkspace = async (workspaceId: string) => {
  const supabase = await createClient();
  return await supabase.from('workspaces').delete().eq('id', workspaceId);
};

export const getUserSubscriptionStatus = async (userId: string) => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['trialing', 'active'])
      .maybeSingle(); // Use maybeSingle to avoid errors if no subscription exists

    if (error) throw error;

    return { data: data as Subscription | null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error fetching subscription status.` };
  }
};

export const getFolders = async (workspaceId: string) => {
  if (!validate(workspaceId)) {
    return { data: null, error: 'Invalid workspaceId' };
  }
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*, files(*)') // ✅ This now includes all related files for each folder
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { data: data as Folder[], error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error getting folders' };
  }
};

export const getWorkspaceDetails = async (workspaceId: string) => {
  if (!validate(workspaceId)) return { data: null, error: 'Invalid workspaceId' };
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*, folders(*, files(*))')
      .eq('id', workspaceId)
      .single(); // .single() is fine here as we expect exactly one

    if (error) throw error;

    return { data: data as workspace, error: null };
  } catch (error) {
    return { data: null, error: 'Error fetching workspace details.' };
  }
};

export const getFileDetails = async (fileId: string) => {
  if (!validate(fileId)) return { data: null, error: 'Invalid fileId' };
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) throw error;

    return { data: data as File, error: null };
  } catch (error) {
    return { data: null, error: 'Error fetching file details.' };
  }
};

export const getFolderDetails = async (folderId: string) => {
  if (!validate(folderId)) return { data: null, error: 'Invalid folderId' };
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*, files(*)')
      .eq('id', folderId)
      .single();

    if (error) throw error;

    return { data: data as Folder, error: null };
  } catch (error) {
    return { data: null, error: 'Error fetching folder details.' };
  }
};

export const deleteFile = async (fileId: string) => {
  const supabase = await createClient();
  return await supabase.from('files').delete().eq('id', fileId);
};

export const deleteFolder = async (folderId: string) => {
  const supabase = await createClient();
  return await supabase.from('folders').delete().eq('id', folderId);
};

export const getPrivateWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*, folders(*, files(*))')
    .eq('workspace_owner', userId);

  if (error) {
    console.log(error);
    return [];
  }
  // This is a simplified version. For a true "private" check, you'd need a more complex query
  // or a database function to check for the non-existence of collaborators.
  return data as workspace[];
};

export const getCollaboratingWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collaborators')
    .select('workspaces(*, folders(*, files(*)))') // Select all columns from the related workspaces table
    .eq('user_id', userId);

  if (error) {
    console.log(error);
    return [];
  }

  // The result is an array of { workspaces: { ... } }. We need to extract the workspace objects.
  return data.map((item) => item.workspaces) as unknown as workspace[];
};

export const getSharedWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const supabase = await createClient();
  // Find workspaces owned by the user that have at least one collaborator
  const { data, error } = await supabase
    .from('workspaces')
    .select('*, collaborators!inner(*), folders(*, files(*)))') // !inner ensures only workspaces with collaborators are returned
    .eq('workspace_owner', userId);

  if (error) {
    console.log(error);
    return [];
  }

  return data as unknown as workspace[];
};

export const getFiles = async (folderId: string) => {
  if (!validate(folderId)) return { data: null, error: 'Invalid folderId' };
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at');

    if (error) throw error;

    return { data: data as File[], error: null };
  } catch (error) {
    return { data: null, error: 'Error fetching files.' };
  }
};

export const addCollaborators = async (users: User[], workspaceId: string) => {
  const supabase = await createClient();
  const newCollaborators = users.map((user) => ({
    user_id: user.id,
    workspace_id: workspaceId,
  }));

  const { error } = await supabase.from('collaborators').insert(newCollaborators);
  if (error) console.log(error);
  return { error };
};

export const removeCollaborators = async (users: User[], workspaceId: string) => {
  const supabase = await createClient();
  const userIdsToRemove = users.map((user) => user.id);

  const { error } = await supabase
    .from('collaborators')
    .delete()
    .eq('workspace_id', workspaceId)
    .in('user_id', userIdsToRemove);

  if (error) console.log(error);
  return { error };
};

export const findUser = async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  return data as User | null;
};

export const getActiveProductsWithPrice = async () => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, prices(*)')
      .eq('active', true)
      .eq('prices.active', true) // Filter on the joined prices table
      .order('metadata->index');

    if (error) throw error;

    return { data: data as ProductWithPrice[], error: null };
  } catch (error) {
    console.log(error);
    return { data: [], error };
  }
};

export const createFolder = async (folder: Folder) => {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from('folders').insert(folder);

    if (error) {
      console.error('Create Folder Error:', error);
      return { data: null, error: 'Error creating folder.' };
    }
    if (!error) revalidatePath('/dashboard');
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'An unexpected error occurred.' };
  }
};

export const updateFolder = async (
  folder: Partial<Folder>,
  folderId: string
) => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('folders')
      .update(folder)
      .eq('id', folderId)
      .select('*')
      .single();

    if (error) {
      console.error('Update Folder Error:', error);
      return { data: null, error: 'Error updating folder.' };
    }

    // return the updated folder row
    return { data: data as Folder, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: 'An unexpected error occurred.' };
  }
};

// queries.ts
export const createFile = async (file: File) => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('files')
      .insert(file)
      .select('*')
      .single();

    if (error) {
      console.error('Create File Error:', error);
      return { data: null, error: 'Error creating file.' };
    }

    return { data: data as File, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: 'An unexpected error occurred.' };
  }
};


export const updateFile = async (file: Partial<File>, fileId: string) => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('files')
      .update(file)
      .eq('id', fileId)
      .select('*')
      .single();

    if (error) {
      console.error('Update File Error:', error);
      return { data: null, error: 'Error updating file.' };
    }

    return { data: data as File, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: 'An unexpected error occurred.' };
  }
};

export const updateWorkspace = async (workspace: Partial<workspace>, workspaceId: string) => {
  if (!workspaceId) return;
  const supabase = await createClient();
  try {
    await supabase.from('workspaces').update(workspace).eq('id', workspaceId);
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: 'Error updating workspace.' };
  }
};

export const getCollaborators = async (workspaceId: string) => {
  if (!validate(workspaceId)) {
    return { data: [] as User[], error: 'Invalid workspaceId' };
  }

  const supabase = await createClient();

  try {
    // when selecting related table via supabase, the nested property name is likely "users"
    const { data, error } = await supabase
      .from('collaborators')
      .select('users(*)')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('getCollaborators error:', error);
      return { data: [] as User[], error };
    }

    // `data` is an array of rows, each row has a `users` property (the related user)
    const users = (data ?? [])
      .map((row: any) => row.users)
      .filter(Boolean)
      .map((u: any) => normalizeUser(u)) as User[];

    return { data: users, error: null };
  } catch (err) {
    console.error(err);
    return { data: [] as User[], error: err as any };
  }
};

export const getUsersFromSearch = async (email: string) => {
  if (!email) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', `${email}%`);

  if (error) {
    console.log(error);
    return [];
  }

  return data as User[];
};