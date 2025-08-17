'use client';
import { AuthUser } from '@supabase/supabase-js';
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmojiPicker from '../global/emoji-picker';
import { useRouter } from 'next/navigation';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useForm } from "react-hook-form";
import { CreateWorkspaceFormSchema } from '@/lib/types';
import { z } from 'zod';
import { Subscription } from '@/lib/supabase/supabase.types';
import { Button } from '../ui/button';
import Loader from '../global/Loader';
import { createWorkspace } from '@/lib/server-actions/auth-actions';
import { v4 } from 'uuid'; 

interface DashboardSetupProps {
  user: AuthUser;
  subscription: Subscription | null;
}

const DashboardSetup: React.FC<DashboardSetupProps> = ({
  subscription,
  user,
}) => {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = useState('💼');
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting: isLoading, errors },
  } = useForm<z.infer<typeof CreateWorkspaceFormSchema>>({
    mode: 'onChange',
    defaultValues: {
      logo: '',
      workspaceName: '',
    },
  });

  const onSubmit = async (value: z.infer<typeof CreateWorkspaceFormSchema>) => {
    const newWorkspace = {
      data: '',
      icon_id: selectedEmoji,
      id: v4(), 
      in_trash: '',
      title: value.workspaceName,
      workspace_owner: user.id,
      logo: value.logo,
      banner_url: '',
    };
    
    // Call the server action
    await createWorkspace(newWorkspace);
  };

  return (
    <Card className="w-[800px] h-screen sm:h-auto">
      <CardHeader>
        <CardTitle>Create A Workspace</CardTitle>
        <CardDescription>
          Lets create a private workspace to get you started. You can add
          collaborators later from the workspace settings tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-4'>
              <div className='text-5xl'>
                <EmojiPicker getValue={(emoji) => setSelectedEmoji(emoji)}>
                  {selectedEmoji}
                </EmojiPicker>
              </div>
              <div className='w-full'>
                <Label htmlFor="workspaceName" className='text-sm text-muted-foreground'>
                  Name
                </Label>
                <Input id='workspaceName' type='text' placeholder="Workspace Name"
                  disabled={isLoading}
                  {...register('workspaceName', {
                    required: 'Workspace name is required',
                  })}
                />
                <small className='text-red-600'>
                  {errors?.workspaceName?.message?.toString()}
                </small>
                {subscription?.status !== 'active' && (
                  <small className='text-muted-foreground block'>
                    To customize your workspace, you need to be on a Pro Plan
                  </small>
                )}
              </div>
            </div>
            <div className='self-end'>
              <Button disabled={isLoading} type="submit">
                {!isLoading ? 'Create Workspace' : <Loader />}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default DashboardSetup;