'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import * as React from 'react';
import { IconType } from 'react-icons';
import { FiFileText, FiGrid, FiLogOut, FiMessageSquare, FiUpload } from 'react-icons/fi';
import Button from '@/components/buttons/Button';

import WrappedReactIcon from '@/components/ui/WrappedReactIcon';
import { cn } from '@/lib/utils';

interface MaintenanceNavLink {
    href: string;
    icon: IconType;
    label: string;
}

const maintenanceNavLinks: MaintenanceNavLink[] = [
    { href: '/maintenance/dashboard', icon: FiGrid, label: 'Dashboard' },
    { href: '/maintenance/dashboard/upload', icon: FiUpload, label: 'Upload Photos' },
    { href: '/maintenance/dashboard/chat', icon: FiMessageSquare, label: 'Chat' },
    { href: '/maintenance/dashboard/inquiries', icon: FiFileText, label: 'Inquiries' },
];

export function MaintenanceSidebar() {
    const pathname = usePathname();

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: '/' });
    };

    return (
        <aside className="w-64 bg-slate-800 text-slate-200 flex flex-col p-4">
            <div className="text-2xl font-bold mb-8 text-center text-white">Maintenance</div>
            <nav className="flex-grow">
                <ul>
                    {maintenanceNavLinks.map(link => {
                        return (
                            <li key={link.href}>
                                <Link href={link.href} className={cn(
                                    'flex items-center space-x-3 p-3 rounded-md transition-colors',
                                    pathname === link.href
                                        ? 'bg-slate-700 text-white'
                                        : 'hover:bg-slate-700/50 hover:text-white'
                                )}>
                                    <WrappedReactIcon icon={link.icon} className="h-5 w-5" />
                                    <span>{link.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div>
                <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full flex items-center justify-start space-x-3 p-3 text-slate-400 hover:bg-slate-700/50 hover:text-red-400"
                >
                    <WrappedReactIcon icon={FiLogOut} className="h-5 w-5" />
                    <span>Logout</span>
                </Button>
            </div>
        </aside>
    );
} 