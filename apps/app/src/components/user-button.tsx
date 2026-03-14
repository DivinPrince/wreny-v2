import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { signOut, useSession } from "#/lib/auth-client";
import { LogOut, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function UserButton() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
          {user?.image ? (
            <img
              className="h-8 w-8 rounded-full object-cover"
              alt={user.name ?? user.email ?? "User"}
              src={user.image}
            />
          ) : (
            <span className="h-8 w-8 rounded-full bg-linear-to-br from-lime-400 from-10% via-cyan-300 to-blue-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={8}
        align="end"
        className="min-w-56"
      >
        <DropdownMenuItem className="flex flex-col items-start focus:bg-transparent cursor-default">
          <p className="text-sm font-medium">{user?.name ?? ""}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="flex w-full items-center justify-between">
            <span className="text-sm">Billing</span>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            window.location.href = "/signin";
          }}
          className="flex w-full items-center justify-between cursor-pointer"
        >
          <span className="text-sm">Log Out</span>
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
