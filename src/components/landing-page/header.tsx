'use client';
import React, { useState } from 'react'
import Link from 'next/link';
import Image from 'next/image';
import Logo from '../../../public/ffLgo.png';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu"

const routes = [
    { title: 'Features', href: '#features' },
    { title: 'Pricing', href: '#pricing' },
    { title: 'Resources', href: '#resources' },
    { title: 'Testimonials', href: '#testimonials' },
];

const components: { title: string; href: string; description: string }[] = [
    {
        title: 'Alert Dialog',
        href: '#',
        description: 'A modal window that demands user attention and requires an action before proceeding.',
    },
    {
        title: 'Hover Card',
        href: '#',
        description: 'Lets users preview linked content by hovering over an element.',
    },
    {
        title: 'Progress',
        href: '#',
        description: 'Shows a visual representation of task completion, often via a progress bar.',
    },
    {
        title: 'Scroll-area',
        href: '#',
        description: 'Used to distinguish and contain scrollable sections of content.',
    },
    {
        title: 'Tabs',
        href: '#',
        description: 'Organizes content into multiple views where only one section is shown at a time.',
    },
    {
        title: 'Tooltip',
        href: '#',
        description: 'A small popup that provides extra information when an element is hovered or focused.',
    },
];

const Header = () => {
    const [path, setPath] = useState('#products');
    return (
        <header className='p-4 flex justify-between items-center bg-black text-blue-400 shadow-md border-b border-blue-900'>
            {/* Logo */}
            <Link href={'/'} className="flex gap-2 items-center">
                <Image src={Logo} alt="Quill-fusion Logo" width={62} height={62} />
                <span className="font-bold text-lg tracking-wide text-neon-blue">Quill.Fusion</span>
            </Link>

            {/* Navigation */}
            <NavigationMenu className="hidden md:block">
                <NavigationMenuList className="gap-4">
                    {routes.map((route) => (
                        <NavigationMenuItem key={route.title}>
                            <NavigationMenuLink asChild>
                                <Link
                                    href={route.href}
                                    className={navigationMenuTriggerStyle()}
                                >
                                    {route.title}
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>

            {/* Auth Buttons */}
            <aside className="flex gap-3">
                <Link href={'/login'}>
                    <Button
                        className="h-10 px-5 min-w-[100px] bg-blue-700 text-white font-semibold hover:bg-blue-600"
                    >
                        Login
                    </Button>
                </Link>
                <Link href="/signup">
                    <Button
                        className="h-10 px-5 min-w-[100px] bg-neon-blue text-white font-semibold hover:bg-blue-300"
                    >
                        Sign Up
                    </Button>
                </Link>
            </aside>
        </header>
    );
};

export default Header;

// Neon blue custom color
const neonBlue = "rgb(0, 238, 255)";

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
    ({ className, title, children, ...props }, ref) => {
        return (
            <li>
                <NavigationMenuLink asChild>
                    <a
                        ref={ref}
                        className={cn(
                            'group block select-none space-y-1 font-medium leading-none hover:text-white text-blue-300'
                        )}
                        {...props}
                    >
                        <div className="text-blue-400 text-sm font-semibold leading-none">
                            {title}
                        </div>
                        <p className="group-hover:text-white line-clamp-2 text-sm leading-snug text-blue-400/60">
                            {children}
                        </p>
                    </a>
                </NavigationMenuLink>
            </li>
        );
    }
);

ListItem.displayName = 'ListItem';
