import { Link } from "@tanstack/react-router"
import { LockKeyhole, Sparkles } from "lucide-react"

import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"

export function AuthRequiredState({
  title = "Sign in to open your dashboard",
  description = "Your resumes, cover letters, and job tracker are connected to your account.",
}: Readonly<{
  title?: string
  description?: string
}>) {
  return (
    <Card className="mx-auto max-w-3xl bg-background">
      <CardHeader className="pb-3 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
          <LockKeyhole className="size-6" />
        </div>
        <CardTitle className="text-3xl">{title}</CardTitle>
        <CardDescription className="mx-auto max-w-xl text-base leading-7">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="rounded-full px-5">
          <Link to="/signin">
            <Sparkles className="size-4" />
            Sign in
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-full px-5">
          <Link to="/signup">Create account</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
