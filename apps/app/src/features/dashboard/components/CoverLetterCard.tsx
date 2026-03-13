import { Link } from "@tanstack/react-router"
import { Eye, Pencil, Trash2 } from "lucide-react"

import { Button } from "#/components/ui/button"
import { Card, CardContent, CardFooter } from "#/components/ui/card"
import { formatRelativeDate } from "#/features/dashboard/lib/format"
import type { DashboardCoverLetter } from "#/features/dashboard/lib/queries"

function previewParagraphs(coverLetter: DashboardCoverLetter) {
  return [
    coverLetter.data.content.greeting,
    coverLetter.data.content.opening,
    ...coverLetter.data.content.body,
    coverLetter.data.content.closing,
    coverLetter.data.content.signature,
  ].filter(Boolean)
}

export function CoverLetterCard({
  coverLetter,
  onDelete,
}: Readonly<{
  coverLetter: DashboardCoverLetter
  onDelete?: (coverLetterId: string) => void
}>) {
  const paragraphs = previewParagraphs(coverLetter)

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-border/70 bg-background shadow-sm">
      <CardContent className="p-0">
        <Link
          to="/dashboard/cover-letters/$id"
          params={{ id: coverLetter.id }}
          className="group block"
        >
          <div className="h-[320px] overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6">
            <div className="rounded-[1.25rem] border bg-background p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {coverLetter.data.context.companyName || "Cover letter"}
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {paragraphs.slice(0, 4).map((paragraph) => (
                  <p key={paragraph} className="line-clamp-3">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 border-t bg-background/80 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{coverLetter.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeDate(coverLetter.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/dashboard/cover-letters/$id" params={{ id: coverLetter.id }}>
              <Eye className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon-sm">
            <Link to="/dashboard/cover-letters/$id" params={{ id: coverLetter.id }}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            onClick={() => onDelete?.(coverLetter.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
