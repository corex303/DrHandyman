'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import * as React from 'react';
import { IconType } from 'react-icons';
import { FiDollarSign, FiEdit, FiEye, FiFileText, FiGrid, FiImage, FiLayers, FiLogOut, FiMessageSquare, FiSettings, FiUsers } from 'react-icons/fi';
import Button from '@/components/buttons/Button';

import WrappedReactIcon from '@/components/ui/WrappedReactIcon';
import { cn } from '@/lib/utils';

interface AdminNavLink {
    href: string;
    icon: IconType;
    label: string;
}

const adminNavLinks: AdminNavLink[] = [
    { href: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
    { href: '/admin/inquiries', icon: FiFileText, label: 'Inquiries' },
    { href: '/admin/portfolio', icon: FiImage, label: 'Portfolio' },
    { href: '/admin/services', icon: FiLayers, label: 'Services' },
    { href: '/admin/users', icon: FiUsers, label: 'Users' },
    { href: '/admin/billing', icon: FiDollarSign, label: 'Billing' },
    { href: '/admin/content', icon: FiEdit, label: 'Content' },
    { href: '/admin/appearance', icon: FiEye, label: 'Appearance' },
    { href: '/admin/settings', icon: FiSettings, label: 'Settings' },
    { href: '/admin/chat', icon: FiMessageSquare, label: 'Chat' },
];

export function AdminSidebar() {
    const pathname = usePathname();

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: '/' });
    };

    return (
        <aside className="w-64 bg-slate-800 text-slate-200 flex flex-col p-4">
            <div className="text-2xl font-bold mb-8 text-center text-white">Dr. Handyman</div>
            <nav className="flex-grow">
                <ul>
                    {adminNavLinks.map(link => {
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