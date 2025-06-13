'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import React, { useState } from 'react';
import { IconType } from 'react-icons';
import { FiChevronDown, FiChevronUp, FiCloud, FiDollarSign, FiEdit, FiFileText, FiGrid, FiImage, FiLayers, FiLogOut, FiMessageSquare, FiSettings, FiUsers, FiEye } from 'react-icons/fi';
import Button from '@/components/buttons/Button';

import WrappedReactIcon from '@/components/ui/WrappedReactIcon';
import { cn } from '@/lib/utils';

interface AdminNavLink {
    href: string;
    icon: IconType;
    label: string;
    subLinks?: AdminNavLink[];
}

const adminNavLinks: AdminNavLink[] = [
    { href: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
    { href: '/admin/inquiries', icon: FiFileText, label: 'Inquiries' },
    { href: '/admin/portfolio', icon: FiImage, label: 'Portfolio' },
    { href: '/admin/services', icon: FiLayers, label: 'Services' },
    { href: '/admin/users', icon: FiUsers, label: 'Users' },
    { href: '/admin/billing', icon: FiDollarSign, label: 'Billing' },
    {
        href: '/admin/service-fusion',
        icon: FiCloud,
        label: 'Service Fusion',
        subLinks: [
            { href: '/admin/service-fusion', icon: FiGrid, label: 'SF Dashboard' },
            { href: '/admin/service-fusion/customers', icon: FiUsers, label: 'Customers' },
            { href: '/admin/service-fusion/jobs', icon: FiLayers, label: 'Jobs' },
            { href: '/admin/service-fusion/estimates', icon: FiFileText, label: 'Estimates' },
            { href: '/admin/service-fusion/invoices', icon: FiDollarSign, label: 'Invoices' },
            { href: '/admin/service-fusion/calendar-tasks', icon: FiEdit, label: 'Calendar' },
            { href: '/admin/service-fusion/read-only', icon: FiEye, label: 'Read-Only Data' },
        ]
    },
    { href: '/admin/content', icon: FiEdit, label: 'Content' },
    { href: '/admin/appearance', icon: FiEye, label: 'Appearance' },
    { href: '/admin/settings', icon: FiSettings, label: 'Settings' },
    { href: '/admin/chat', icon: FiMessageSquare, label: 'Chat' },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        '/admin/service-fusion': pathname.startsWith('/admin/service-fusion'),
    });

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: '/' });
    };

    const toggleSection = (href: string) => {
        setOpenSections(prev => ({ ...prev, [href]: !prev[href] }));
    };

    return (
        <aside className="w-64 bg-slate-800 text-slate-200 flex flex-col p-4">
            <div className="text-2xl font-bold mb-8 text-center text-white">Dr. Handyman</div>
            <nav className="flex-grow">
                <ul>
                    {adminNavLinks.map(link => {
                        const hasSubLinks = !!link.subLinks?.length;
                        const isSectionOpen = openSections[link.href];
                        const isParentActive = pathname.startsWith(link.href);

                        if (hasSubLinks) {
                            return (
                                <li key={link.href}>
                                    <button
                                        onClick={() => toggleSection(link.href)}
                                        className={cn(
                                            'w-full flex items-center justify-between p-3 rounded-md transition-colors',
                                            isParentActive
                                                ? 'bg-slate-700 text-white'
                                                : 'hover:bg-slate-700/50 hover:text-white'
                                        )}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <WrappedReactIcon icon={link.icon} className="h-5 w-5" />
                                            <span>{link.label}</span>
                                        </div>
                                        <WrappedReactIcon icon={isSectionOpen ? FiChevronUp : FiChevronDown} className="h-4 w-4" />
                                    </button>
                                    {isSectionOpen && (
                                        <ul className="pl-4 pt-2">
                                            {link.subLinks?.map(subLink => (
                                                <li key={subLink.href}>
                                                    <Link href={subLink.href} className={cn(
                                                        'flex items-center space-x-3 p-2 rounded-md transition-colors text-sm',
                                                        pathname === subLink.href
                                                            ? 'bg-slate-600 text-white'
                                                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                                    )}>
                                                        <WrappedReactIcon icon={subLink.icon} className="h-4 w-4" />
                                                        <span>{subLink.label}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        }

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