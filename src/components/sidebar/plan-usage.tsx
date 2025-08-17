'use client';

import { MAX_FOLDERS_FREE_PLAN } from "@/lib/constants";
import { useAppState } from "@/lib/providers/state-provider";
import { Subscription } from "@/lib/supabase/supabase.types";
import { useEffect, useState } from "react";
import DiamondIcon from "../icons/diamondIcon";
import { Progress } from "../ui/progress";

interface PlanUsageProps {
  foldersLength: number;
  subscription: Subscription | null;
}

const PlanUsage: React.FC<PlanUsageProps> = ({
  foldersLength,
  subscription,
}) => {
  const { workspaceId, state } = useAppState();
  const [usagePercentage, setUsagePercentage] = useState(
    (foldersLength / MAX_FOLDERS_FREE_PLAN) * 100
  );

  useEffect(() => {
    const currentWorkspace = state.workspaces.find(
      (workspace) => workspace.id === workspaceId
    );
    if (!currentWorkspace) return;

    const activeFoldersLength = currentWorkspace.folders.filter(
      (folder) => !folder.in_trash
    ).length;

    setUsagePercentage((activeFoldersLength / MAX_FOLDERS_FREE_PLAN) * 100);
  }, [state, workspaceId]);

  if (subscription?.status === "active") return null;

  return (
    <article className="mb-4">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground mb-2">
        <div className="flex items-center gap-2">
          <DiamondIcon className="h-4 w-4 shrink-0" />
          <span>Free Plan</span>
        </div>
        <span className="text-xs">{usagePercentage.toFixed(0)}% / 100%</span>
      </div>

      <Progress value={usagePercentage} className="h-1" />
    </article>
  );
};

export default PlanUsage;
