"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { LayoutDashboard, UserCog, Settings, LogOut } from "lucide-react";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarDemo() {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Profile",
      href: "#",
      icon: <UserCog className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Settings",
      href: "#",
      icon: <Settings className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Logout",
      href: "#",
      icon: <LogOut className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
  ];
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex h-[60vh] w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 md:flex-row",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink key={link.label} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Alex Carter",
                href: "#",
                icon: (
                  <Image
                    src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&q=80&auto=format&fit=crop"
                    className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                    width={40}
                    height={40}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard />
    </div>
  );
}

export const Logo = () => {
  return (
    <Link href="#" className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black">
      <div className="h-5 w-6 flex-shrink-0 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium text-black dark:text-white">
        Acet Labs
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link href="#" className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black">
      <div className="h-5 w-6 flex-shrink-0 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm bg-black dark:bg-white" />
    </Link>
  );
};

const Dashboard = () => {
  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900 md:p-10">
        <div className="flex gap-2">
          {[...new Array(4)].map((_, idx) => (
            <div key={`stat-${idx}`} className="h-20 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />
          ))}
        </div>
        <div className="flex flex-1 gap-2">
          {[...new Array(2)].map((_, idx) => (
            <div key={`chart-${idx}`} className="h-full w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />
          ))}
        </div>
      </div>
    </div>
  );
};


