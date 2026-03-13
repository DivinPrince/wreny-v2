"use client";
import { Button } from "#/components/ui/button";
import { Icons } from "#/components/ui/icons";
import { signOut } from "#/lib/auth-client";

export function SignOut() { 
  return (
    <Button variant="outline" className="font-mono gap-2 flex items-center" onClick={async () => await signOut()}>
      <Icons.SignOut className="size-4" />
      <span>Sign out</span>
    </Button>
  );
}