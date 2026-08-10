'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdmin } from '@/components/providers/AdminProvider';
import {
  ShieldAlert,
  Users,
  Send,
  UserCheck,
  User,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const admin = useAdmin();

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch {
      router.push('/admin/login');
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { href: '/admin/admins', label: 'Manage Admins', icon: UserCheck, permission: 'admins.view' },
    { href: '/admin/users', label: 'Users', icon: Users, permission: 'users.view' },
    { href: '/admin/outreaches', label: 'Outreaches', icon: Send, permission: 'outreaches.view' },
    { href: '/admin/profile', label: 'Admin Profile', icon: User },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return (admin?.permissions || []).includes(item.permission);
  });

  return (
    <aside className="sidebar border-red-950/30">
      <div className="sidebar-logo border-red-950/40">
        <Link href="/admin/dashboard" className="flex flex-col gap-1">
          <Image
            src="/logo_dark.png"
            alt="OutreachTracker"
            width={160}
            height={40}
            style={{objectFit: 'contain' }}
            priority
          />
          {/* <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 pl-0.5">Admin Console</span> */}
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title text-red-400/70">Administration</div>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active text-red-400 bg-red-500/10' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer border-red-950/40">
        <button
          type="button"
          onClick={handleLogout}
          className="nav-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}
