import { ReactNode } from 'react';
import Sidebar from '@/components/sidebar/sidebar';
import MobileSidebar from '@/components/sidebar/mobile-sidebar';

interface LayoutProps {
  children: ReactNode;
  params: any;
}

export default function Layout({ children, params }: LayoutProps) {
  return (
    <main className='flex overflow-hidden h-screen w-screen'>
      <Sidebar params={params} />
      <MobileSidebar>
        <Sidebar
          params={params}
          className="w-screen inline-block sm:hidden"
        />
      </MobileSidebar>
      <div
        className="dark:boder-Neutrals-12/70 border-l-[1px] w-full relative overflow-scroll">
        {children}
      </div>
    </main>
  );
}
