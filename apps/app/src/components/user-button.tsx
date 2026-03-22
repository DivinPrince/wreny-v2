import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { signOut, useSession } from "#/lib/auth-client";
import Avatar from "boring-avatars";
import { LogOut, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";

// Emerald primary palette from theme – supports light/dark backgrounds
const AVATAR_COLORS = [
  "oklch(0.35 0.1 162)",
  "oklch(0.45 0.12 162)",
  "oklch(0.52 0.14 162)",
  "oklch(0.65 0.12 162)",
  "oklch(0.78 0.08 162)",
];

export default function UserButton() {
  const { data } = useSession();
  const user = data?.user;
  const displayName = user?.name ?? user?.email ?? "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full p-0 overflow-hidden size-8 min-w-8 [&_svg]:size-full!"
        >
          {user?.image ? (
            <img
              className="size-full rounded-full object-cover"
              alt={displayName}
              src={user.image}
            />
          ) : (
            <Avatar
              name={displayName}
              size={32}
              variant="beam"
              square={false}
              colors={AVATAR_COLORS}
            />
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
