
"use client"
import React from 'react';
import {
  // SidebarHeader, // Not needed if sidebar is removed
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  // SidebarFooter, // Not needed if sidebar is removed
  // SidebarGroup, // Not needed if sidebar is removed
  // SidebarGroupLabel, // Not needed if sidebar is removed
  SidebarSeparator,
} from '@/components/ui/sidebar'; // Keep if other parts of sidebar UI are used elsewhere, or remove entirely if not
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  UserCog,
  CreditCard,
  LineChart,
  Settings,
  HelpCircle,
  LogOut,
  DollarSign, 
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// If these nav items are still needed elsewhere (e.g. a top menu), they can be kept.
// Otherwise, this component might be entirely removable.
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/orders', icon: ShoppingCart, label: 'Order' },
  { href: '/', icon: Package, label: 'Product' }, 
  { href: '/customers', icon: Users, label: 'Customer' },
  { href: '/employees', icon: UserCog, label: 'Employee' },
  { href: '/billing', icon: CreditCard, label: 'Billing' },
  { href: '/analytics', icon: LineChart, label: 'Analytics' },
];

const secondaryNavItems = [
    { href: '/settings', icon: Settings, label: 'Setting' },
    { href: '/help', icon: HelpCircle, label: 'Help' },
];

// This component might be redundant now if the sidebar is completely removed.
// If you intend to use this navigation structure elsewhere (e.g., a dropdown menu in the header),
// it can be adapted. For now, it's left but won't be rendered by default layout.
export function AppSidebarContent() {
  const pathname = usePathname();

  return (
    <>
      {/* <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary ">
          <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20 L40 20 L40 40 L60 40 L60 20 L80 20 L80 80 L60 80 L60 60 L40 60 L40 80 L20 80 Z" fill="hsl(var(--primary))"/>
            <path d="M25 25 L35 25 L35 35 L45 35 L45 25 L55 25 L55 45 L45 45 L45 55 L35 55 L35 45 L25 45 Z" fill="hsl(var(--primary-foreground))" transform="translate(20, 20)"/>
          </svg>
          <span className="text-foreground">Puzzler</span>
        </Link>
      </SidebarHeader> */}
      <div className="p-4 flex flex-col gap-2"> {/* Example: Wrap in a div if used outside sidebar context */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary mb-4">
            <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" data-ai-hint="puzzle logo">
              <path d="M20 20 L40 20 L40 40 L60 40 L60 20 L80 20 L80 80 L60 80 L60 60 L40 60 L40 80 L20 80 Z" fill="hsl(var(--primary))"/>
              <path d="M25 25 L35 25 L35 35 L45 35 L45 25 L55 25 L55 45 L45 45 L45 55 L35 55 L35 45 L25 45 Z" fill="hsl(var(--primary-foreground))" transform="translate(20, 20)"/>
            </svg>
            <span className="text-foreground">Puzzler</span>
        </Link>
        <SidebarMenu className="flex-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="text-sm"
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarMenu className=""> {/* Removed p-4, spacing handled by parent or items */}
          {secondaryNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="text-sm"
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarSeparator className="my-2" />
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sm" tooltip="Log out">
              <Link href="/logout">
                <LogOut />
                <span>Log out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </>
  );
}
