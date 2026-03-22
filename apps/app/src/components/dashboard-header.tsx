import type { ComponentProps } from "react";
import { Icons } from "#/components/ui/icons";
import { SidebarTrigger, useSidebar } from "#/components/ui/sidebar";
import { cn } from "#/lib/utils";
import UserButton from "./user-button";

export function DashboardHeader({
  className,
}: Pick<ComponentProps<"header">, "className"> = {}) {
  const { state, isMobile } = useSidebar();
  const showTrigger = isMobile || state === "collapsed";

  return (
    <header
      className={cn(
        "flex h-9 shrink-0 items-center justify-between gap-2 border-b px-4",
        className,
      )}
    >
      {showTrigger ? <SidebarTrigger className="-ml-1">
        <Icons.PanelLeftOpen />
      </SidebarTrigger> : <div />}
      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  );
}
