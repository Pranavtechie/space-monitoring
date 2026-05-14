import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  BookOpenIcon,
  DatabaseIcon,
  Settings2Icon,
  SquareTerminalIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import UserMenu from "@/components/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@app/ui/components/sidebar";

const navItems = {
  navMain: [
    {
      title: "Workspace",
      url: "/",
      icon: <SquareTerminalIcon />,
      isActive: true,
      items: [
        {
          title: "Home",
          url: "/",
        },
        {
          title: "Dashboard",
          url: "/dashboard",
        },
        {
          title: "Sign in",
          url: "/login",
        },
      ],
    },
    {
      title: "Data",
      url: "#",
      icon: <DatabaseIcon />,
      items: [
        {
          title: "CSV Imports",
          url: "#",
        },
        {
          title: "Organization Lists",
          url: "#",
        },
        {
          title: "Review Queue",
          url: "#",
        },
      ],
    },
    {
      title: "Reference",
      url: "#",
      icon: <BookOpenIcon />,
      items: [
        {
          title: "README",
          url: "#",
        },
        {
          title: "Prompts",
          url: "#",
        },
        {
          title: "Exports",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Preferences",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
      ],
    },
  ],
};

function isPathActive(currentPath: string, itemPath: string) {
  if (itemPath === "#") {
    return false;
  }

  return currentPath === itemPath;
}

function AppBrand() {
  return (
    <div className="flex h-14 items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <div className="flex aspect-square size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
        <img src="/earth.png" alt="" className="size-full object-cover" aria-hidden="true" />
      </div>
      <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate text-sm font-semibold">Space Monitoring </span>
        <span className="truncate text-xs text-muted-foreground">
          Monitor the <span className="font-extrabold">Space Industry</span>
        </span>
      </div>
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navMain = navItems.navMain.map((item) => {
    const items = item.items?.map((subItem) => ({
      ...subItem,
      isActive: isPathActive(currentPath, subItem.url),
    }));

    return {
      ...item,
      isActive: isPathActive(currentPath, item.url) || items?.some((subItem) => subItem.isActive),
      items,
    };
  });
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-1">
          <UserMenu />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
