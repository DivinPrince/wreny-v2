import { Link } from "@tanstack/react-router"
import { Eye, Pencil, Trash2 } from "lucide-react"

import { Button } from "#/components/ui/button"
import { Card, CardContent, CardFooter } from "#/components/ui/card"
import type { DashboardResume } from "#/features/dashboard/lib/queries"
import { ResumeRenderer } from "#/features/resume/rendering/ResumeRenderer"
import { formatRelativeDate } from "#/features/dashboard/lib/format"

export function ResumeCard({
  resume,
  onDelete,
}: Readonly<{
  resume: DashboardResume
  onDelete?: (resumeId: string) => void
}>) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-background shadow-sm">
      <CardContent className="p-0">
        <Link
          to="/dashboard/resume/$id"
          params={{ id: resume.id }}
          className="group block"
        >
          <div className="relative h-[320px] overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
            <div className="absolute inset-0">
              <div className="origin-top-left scale-[0.24] p-4" style={{ width: "416.66%" }}>
                <ResumeRenderer resume={resume.data} mode="thumbnail" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.12))]" />
          </div>
        </Link>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 border-t bg-background/80 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{resume.title}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeDate(resume.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/dashboard/resume/$id" params={{ id: resume.id }}>
              <Eye className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/dashboard/resume/$id" params={{ id: resume.id }}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            onClick={() => onDelete?.(resume.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
