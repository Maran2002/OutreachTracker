'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  ListFilter,
  Bell,
  User,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/outreach/add', label: 'Add Outreach', icon: PlusCircle },
    { href: '/outreach', label: 'All Outreach', icon: ListFilter },
    { href: '/reminders', label: 'Reminders', icon: Bell },
    { href: '/profile', label: 'Profile Settings', icon: User },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link href="/dashboard">
          <Image
            src="/logo_dark.png"
            alt="OutreachTracker"
            width={160}
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Main Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          
          let isActive = false;
          if (item.href === '/outreach') {
            isActive = pathname.startsWith('/outreach') && pathname !== '/outreach/add';
          } else {
            isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/outreach' && pathname.startsWith(item.href));
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          onClick={handleLogout}
          className="nav-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
