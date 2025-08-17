import React from "react";
import { createClient } from "@/util/supabase/server";
import {
  getCollaboratingWorkspaces,
  getFolders,
  getPrivateWorkspaces,
  getSharedWorkspaces,
  getUserSubscriptionStatus,
} from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";
import WorkspaceDropdown from "./workspace-dropdown";
import PlanUsage from "./plan-usage";
import NativeNavigation from "./native-navigation";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "./folders-dropdown-list";

interface SidebarProps {
  params: { workspaceId: string };
  className?: string;
}

const Sidebar = async ({ params, className }: SidebarProps) => {
  const supabase = createClient(); 
  const awaitedParams = await params;

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) return null;

  const { data: subscriptionData, error: subscriptionError } =
    await getUserSubscriptionStatus(user.id);

  const { data: workspaceFolderData, error: foldersError } = await getFolders(
    awaitedParams.workspaceId
  );

  if (subscriptionError || foldersError) {
    redirect("/dashboard");
  }

  const [privateWorkspaces, collaboratingWorkspaces, sharedWorkspaces] =
    await Promise.all([
      getPrivateWorkspaces(user.id),
      getCollaboratingWorkspaces(user.id),
      getSharedWorkspaces(user.id),
    ]);

  const defaultWorkspace = [
    ...privateWorkspaces,
    ...collaboratingWorkspaces,
    ...sharedWorkspaces,
  ].find((workspace) => workspace.id === awaitedParams.workspaceId);

  return (
    <aside
      className={twMerge(
        "hidden sm:flex flex-col w-[280px] shrink-0 p-4 md:gap-4 bg-background border-r border-muted-foreground/20",
        className
      )}
    >
      <div className="flex flex-col gap-y-2">
        <WorkspaceDropdown
          privateWorkspaces={privateWorkspaces}
          sharedWorkspaces={sharedWorkspaces}
          collaboratingWorkspaces={collaboratingWorkspaces}
          defaultValue={defaultWorkspace}
        />
        <PlanUsage
          foldersLength={workspaceFolderData?.length ?? 0}
          subscription={subscriptionData}
        />
        <NativeNavigation myWorkspaceId={awaitedParams.workspaceId} />
      </div>

      <div className="relative flex-grow mt-4">
        <ScrollArea className="absolute top-0 left-0 w-full h-full">
          {foldersError ? (
            <div className="px-2 py-4 text-muted-foreground text-sm">
              Error loading folders.
            </div>
          ) : (
            <FoldersDropdownList
              workspaceFolders={workspaceFolderData ?? []}
              workspaceId={awaitedParams.workspaceId}
            />
          )}
          <div className="pointer-events-none w-full absolute bottom-0 h-20 bg-gradient-to-t from-background to-transparent z-40" />
        </ScrollArea>
      </div>
    </aside>
  );
};

export default Sidebar;
