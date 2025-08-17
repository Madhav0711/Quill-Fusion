import Link from 'next/link';
import React from 'react';
import { twMerge } from 'tailwind-merge';
import HomeIcon from '../icons/homeIcon';
import SettingsIcon from '../icons/settingsIcon';
import TrashIcon from '../icons/trashIcon';
import Settings from '../settings/settings';
import Trash from '../trash/trash';

interface NativeNavigationProps {
  myWorkspaceId: string;
  className?: string;
}

const NativeNavigation: React.FC<NativeNavigationProps> = ({
  myWorkspaceId,
  className,
}) => {
  return (
    <nav className={twMerge('my-2', className)}>
      <ul className="flex flex-col gap-1.5">
        {/* My Workspace */}
        <li>
          <Link
            href={`/dashboard/${myWorkspaceId}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
          >
            <HomeIcon className="shrink-0" />
            <span className="truncate">My Workspace</span>
          </Link>
        </li>

        {/* Settings */}
        <Settings>
          <li
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground cursor-pointer"
          >
            <SettingsIcon className="shrink-0" />
            <span className="truncate">Settings</span>
          </li>
        </Settings>

        <Trash>
          <li
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground cursor-pointer"
          >
            <TrashIcon className="shrink-0" />
            <span className="truncate">Trash</span>
          </li>
        </Trash>
      </ul>
    </nav>
  );
};

export default NativeNavigation;
