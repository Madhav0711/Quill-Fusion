'use client';
import { useAppState } from '@/lib/providers/state-provider';
import { workspace } from '@/lib/supabase/supabase.types';
import React, { useEffect, useState } from 'react';
import SelectedWorkspace from './selected-workspace';
import CustomDialogTrigger from '../global/custom-dialog-trigger';
import WorkspaceCreator from '../global/workspace-creator';

interface WorkspaceDropdownProps {
  privateWorkspaces: workspace[] | [];
  sharedWorkspaces: workspace[] | [];
  collaboratingWorkspaces: workspace[] | [];
  defaultValue: workspace | undefined;
}

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  privateWorkspaces,
  collaboratingWorkspaces,
  sharedWorkspaces,
  defaultValue,
}) => {
  const { dispatch, state } = useAppState();
  const [selectedOption, setSelectedOption] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!state.workspaces.length) {
      dispatch({
        type: 'SET_WORKSPACES',
        payload: {
          workspaces: [
            ...privateWorkspaces,
            ...sharedWorkspaces,
            ...collaboratingWorkspaces,
          ].map((workspace) => ({ ...workspace, folders: [] })),
        },
      });
    }
  }, [privateWorkspaces, collaboratingWorkspaces, sharedWorkspaces]);

  const handleSelect = (option: workspace) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  useEffect(() => {
    const findSelectedWorkspace = state.workspaces.find(
      (workspace: { id: string | undefined }) =>
        workspace.id === defaultValue?.id
    );
    if (findSelectedWorkspace) setSelectedOption(findSelectedWorkspace);
  }, [state, defaultValue]);

  return (
    <div className="relative inline-block text-left w-full">
      <div>
        <span
          onClick={() => setIsOpen(!isOpen)}
          className="block cursor-pointer w-full"
        >
          {selectedOption ? (
            <SelectedWorkspace workspace={selectedOption} />
          ) : (
            'Select a workspace'
          )}
        </span>
      </div>

      {isOpen && (
        <div
          className="absolute mt-2 w-full 
          origin-top-right z-50 
          rounded-2xl shadow-lg 
          bg-black/20 backdrop-blur-xl 
          border border-muted 
          overflow-y-auto max-h-56"
        >
          <div className="flex flex-col p-2">
            {!!privateWorkspaces.length && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground px-1 mb-1">Private</p>
                <div className="space-y-1">
                  {privateWorkspaces.map((option) => (
                    <SelectedWorkspace
                      key={option.id}
                      workspace={option}
                      onClick={handleSelect}
                    />
                  ))}
                </div>
                <hr className="my-2 border-muted" />
              </div>
            )}

            {!!sharedWorkspaces.length && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground px-1 mb-1">Shared</p>
                <div className="space-y-1">
                  {sharedWorkspaces.map((option) => (
                    <SelectedWorkspace
                      key={option.id}
                      workspace={option}
                      onClick={handleSelect}
                    />
                  ))}
                </div>
                <hr className="my-2 border-muted" />
              </div>
            )}

            {!!collaboratingWorkspaces.length && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground px-1 mb-1">Collaborating</p>
                <div className="space-y-1">
                  {collaboratingWorkspaces.map((option) => (
                    <SelectedWorkspace
                      key={option.id}
                      workspace={option}
                      onClick={handleSelect}
                    />
                  ))}
                </div>
                <hr className="my-2 border-muted" />
              </div>
            )}

            <CustomDialogTrigger
              header="Create A Workspace"
              content={<WorkspaceCreator />}
              description="Workspaces give you the power to collaborate with others. You can change your workspace privacy settings after creating the workspace too."
            >
              <div
                className="flex items-center gap-2 
                p-2 rounded-lg cursor-pointer 
                transition-all hover:bg-muted/40"
              >
                <article
                  className="text-slate-400 rounded-full bg-slate-800 
                  w-5 h-5 flex items-center justify-center text-sm"
                >
                  +
                </article>
                <span className="text-sm text-muted-foreground">
                  Create workspace
                </span>
              </div>
            </CustomDialogTrigger>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDropdown;
