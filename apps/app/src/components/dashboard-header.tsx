import { Icons } from "#/components/ui/icons";
import { SidebarTrigger, useSidebar } from "#/components/ui/sidebar";
import UserButton from "./user-button";

export function DashboardHeader() {
  const { state, isMobile } = useSidebar();
  const showTrigger = isMobile || state === "collapsed";

  return (
    <header className="flex justify-between h-9 shrink-0 items-center gap-2 border-b px-4">
      {showTrigger ? <SidebarTrigger className="-ml-1">
        <Icons.PanelLeftOpen />
      </SidebarTrigger> : <div />}
      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  );
}
