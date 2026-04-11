import { useEffect, useId, useMemo, useState } from 'react'
import { defaultLayout } from '@repo/core/schemas'
import type { ResumeDocument } from '@repo/core/schemas'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, RotateCcw } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'

import { cloneResumeDocument } from '../../lib/queries'
import { collectLayoutSectionOptions } from '../../lib/resume-layout'
import { useResumeEditor } from '../resume-editor-context'
import { StepPanel } from '../resume-editor-shell'

function cloneLayout(layout: string[][][]): string[][][] {
  return layout.map((page) => page.map((col) => [...col]))
}

function removeSectionAt(
  layout: string[][][],
  pageIdx: number,
  colIdx: number,
  index: number,
): string[][][] {
  const next = cloneLayout(layout)
  const col = next[pageIdx]?.[colIdx]
  if (!col) return layout
  col.splice(index, 1)
  return next
}

function addSectionToColumn(
  layout: string[][][],
  pageIdx: number,
  colIdx: number,
  sectionId: string,
): string[][][] {
  const next = cloneLayout(layout)
  while (next.length <= pageIdx) {
    next.push([[]])
  }
  const page = next[pageIdx]!
  while (page.length <= colIdx) {
    page.push([])
  }
  const col = page[colIdx]!
  if (!col.includes(sectionId)) {
    col.push(sectionId)
  }
  return next
}

function moveWithinColumn(
  layout: string[][][],
  pageIdx: number,
  colIdx: number,
  fromIndex: number,
  delta: number,
): string[][][] {
  const next = cloneLayout(layout)
  const col = next[pageIdx]?.[colIdx]
  if (!col) return layout
  const toIndex = fromIndex + delta
  if (toIndex < 0 || toIndex >= col.length) return layout
  const [item] = col.splice(fromIndex, 1)
  if (item === undefined) return layout
  col.splice(toIndex, 0, item)
  return next
}

function moveAcrossColumn(
  layout: string[][][],
  pageIdx: number,
  fromCol: number,
  toCol: number,
  index: number,
): string[][][] {
  const next = cloneLayout(layout)
  const page = next[pageIdx]
  if (!page) return layout
  while (page.length <= Math.max(fromCol, toCol)) {
    page.push([])
  }
  const source = page[fromCol]
  const target = page[toCol]
  if (!source || !target) return layout
  const [item] = source.splice(index, 1)
  if (item === undefined) return layout
  target.push(item)
  return next
}

function addPage(layout: string[][][]): string[][][] {
  const next = cloneLayout(layout)
  next.push([[], []])
  return next
}

function removeEmptyPage(layout: string[][][], pageIdx: number): string[][][] {
  if (layout.length <= 1) return layout
  const next = cloneLayout(layout)
  next.splice(pageIdx, 1)
  return next
}

export function DocumentStep() {
  const { resume, saveResume, isSaving, title } = useResumeEditor()
  const docFieldIds = useId()
  const [draft, setDraft] = useState<ResumeDocument>(() => cloneResumeDocument(resume))
  const [addSectionId, setAddSectionId] = useState('')

  useEffect(() => {
    setDraft(cloneResumeDocument(resume))
  }, [resume])

  const sectionOptions = useMemo(() => collectLayoutSectionOptions(draft), [draft])

  async function commit(next: ResumeDocument) {
    setDraft(next)
    await saveResume({ resume: next, title })
  }

  const layout = draft.metadata.layout
  const meta = draft.metadata

  return (
    <StepPanel className="gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Document</h2>
        <p className="text-sm text-muted-foreground">
          Page background, layout order, print options, notes, and custom CSS.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold">Theme</h3>
          <div className="space-y-2">
            <Label htmlFor="doc-bg">Page background</Label>
            <div className="flex items-center gap-2">
              <input
                id="doc-bg"
                type="color"
                value={meta.theme.background}
                onChange={(e) => {
                  const next = cloneResumeDocument(draft)
                  next.metadata.theme.background = e.target.value
                  void commit(next)
                }}
                className="h-10 w-14 cursor-pointer rounded border border-input bg-transparent"
              />
              <Input
                value={meta.theme.background}
                onChange={(e) => {
                  const next = cloneResumeDocument(draft)
                  next.metadata.theme.background = e.target.value
                  void commit(next)
                }}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold">Page options</h3>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${docFieldIds}-break-line`}
              checked={meta.page.options.breakLine}
              onCheckedChange={(c) => {
                const next = cloneResumeDocument(draft)
                next.metadata.page.options.breakLine = c === true
                void commit(next)
              }}
            />
            <Label htmlFor={`${docFieldIds}-break-line`} className="cursor-pointer text-sm font-normal">
              Section break lines
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${docFieldIds}-page-numbers`}
              checked={meta.page.options.pageNumbers}
              onCheckedChange={(c) => {
                const next = cloneResumeDocument(draft)
                next.metadata.page.options.pageNumbers = c === true
                void commit(next)
              }}
            />
            <Label htmlFor={`${docFieldIds}-page-numbers`} className="cursor-pointer text-sm font-normal">
              Page numbers
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-notes">Private notes</Label>
        <Textarea
          id="doc-notes"
          value={meta.notes}
          onChange={(e) => {
            const next = cloneResumeDocument(draft)
            next.metadata.notes = e.target.value
            setDraft(next)
          }}
          onBlur={() => void commit(draft)}
          className="min-h-24 rounded-xl"
          placeholder="Not shown on the resume"
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Custom CSS</h3>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${docFieldIds}-css-visible`}
              checked={meta.css.visible}
              onCheckedChange={(c) => {
                const next = cloneResumeDocument(draft)
                next.metadata.css.visible = c === true
                void commit(next)
              }}
            />
            <Label htmlFor={`${docFieldIds}-css-visible`} className="cursor-pointer text-sm font-normal">
              Apply
            </Label>
          </div>
        </div>
        <Textarea
          value={meta.css.value}
          onChange={(e) => {
            const next = cloneResumeDocument(draft)
            next.metadata.css.value = e.target.value
            setDraft(next)
          }}
          onBlur={() => void commit(draft)}
          className="min-h-32 rounded-xl font-mono text-sm"
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <h3 className="text-sm font-semibold">Legacy style overrides</h3>
        <p className="text-xs text-muted-foreground">
          Optional fields merged by some templates. Leave blank to use defaults above.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Font family</Label>
            <Input
              value={meta.styles?.fontFamily ?? ''}
              onChange={(e) => {
                const next = cloneResumeDocument(draft)
                next.metadata.styles = { ...next.metadata.styles, fontFamily: e.target.value || undefined }
                setDraft(next)
              }}
              onBlur={() => void commit(draft)}
            />
          </div>
          <div className="space-y-2">
            <Label>Font size</Label>
            <Input
              type="number"
              value={meta.styles?.fontSize ?? ''}
              onChange={(e) => {
                const next = cloneResumeDocument(draft)
                const n = Number(e.target.value)
                next.metadata.styles = {
                  ...next.metadata.styles,
                  fontSize: e.target.value === '' || !Number.isFinite(n) ? undefined : n,
                }
                setDraft(next)
              }}
              onBlur={() => void commit(draft)}
            />
          </div>
          <div className="space-y-2">
            <Label>Line height</Label>
            <Input
              type="number"
              step="0.05"
              value={meta.styles?.lineHeight ?? ''}
              onChange={(e) => {
                const next = cloneResumeDocument(draft)
                const n = Number(e.target.value)
                next.metadata.styles = {
                  ...next.metadata.styles,
                  lineHeight: e.target.value === '' || !Number.isFinite(n) ? undefined : n,
                }
                setDraft(next)
              }}
              onBlur={() => void commit(draft)}
            />
          </div>
          <div className="space-y-2">
            <Label>Section spacing</Label>
            <Input
              type="number"
              value={meta.styles?.sectionSpacing ?? ''}
              onChange={(e) => {
                const next = cloneResumeDocument(draft)
                const n = Number(e.target.value)
                next.metadata.styles = {
                  ...next.metadata.styles,
                  sectionSpacing: e.target.value === '' || !Number.isFinite(n) ? undefined : n,
                }
                setDraft(next)
              }}
              onBlur={() => void commit(draft)}
            />
          </div>
          <div className="space-y-2">
            <Label>Highlight color</Label>
            <Input
              value={meta.styles?.highlightColor ?? ''}
              onChange={(e) => {
                const next = cloneResumeDocument(draft)
                next.metadata.styles = { ...next.metadata.styles, highlightColor: e.target.value || undefined }
                setDraft(next)
              }}
              onBlur={() => void commit(draft)}
            />
          </div>
          <div className="space-y-2">
            <Label>Text color</Label>
            <Input
              value={meta.styles?.textColor ?? ''}
              onChange={(e) => {
                const next = cloneResumeDocument(draft)
                next.metadata.styles = { ...next.metadata.styles, textColor: e.target.value || undefined }
                setDraft(next)
              }}
              onBlur={() => void commit(draft)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Layout</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const next = cloneResumeDocument(draft)
                next.metadata.layout = addPage(next.metadata.layout)
                void commit(next)
              }}
            >
              <Plus className="size-4" />
              Add page
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const next = cloneResumeDocument(draft)
                next.metadata.layout = structuredClone(defaultLayout)
                void commit(next)
              }}
            >
              <RotateCcw className="size-4" />
              Reset to default
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {layout.map((columns, pageIdx) => (
            <div key={pageIdx} className="rounded-xl border border-border bg-background p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Page {pageIdx + 1}</p>
                {layout.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      const next = cloneResumeDocument(draft)
                      next.metadata.layout = removeEmptyPage(next.metadata.layout, pageIdx)
                      void commit(next)
                    }}
                  >
                    Remove page
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {columns.map((column, colIdx) => (
                  <div
                    key={colIdx}
                    className={cn(
                      'rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 p-3',
                    )}
                  >
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Column {colIdx + 1}</p>
                    <ul className="space-y-2">
                      {column.map((sectionId, index) => (
                        <li
                          key={`${pageIdx}-${colIdx}-${sectionId}-${index}`}
                          className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                        >
                          <span className="min-w-0 flex-1 truncate font-mono text-xs">{sectionId}</span>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label="Move up"
                            onClick={() => {
                              const next = cloneResumeDocument(draft)
                              next.metadata.layout = moveWithinColumn(
                                next.metadata.layout,
                                pageIdx,
                                colIdx,
                                index,
                                -1,
                              )
                              void commit(next)
                            }}
                          >
                            <ChevronUp className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label="Move down"
                            onClick={() => {
                              const next = cloneResumeDocument(draft)
                              next.metadata.layout = moveWithinColumn(
                                next.metadata.layout,
                                pageIdx,
                                colIdx,
                                index,
                                1,
                              )
                              void commit(next)
                            }}
                          >
                            <ChevronDown className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label="Move left"
                            disabled={colIdx <= 0}
                            onClick={() => {
                              if (colIdx <= 0) return
                              const next = cloneResumeDocument(draft)
                              next.metadata.layout = moveAcrossColumn(
                                next.metadata.layout,
                                pageIdx,
                                colIdx,
                                colIdx - 1,
                                index,
                              )
                              void commit(next)
                            }}
                          >
                            <ChevronLeft className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label="Move right"
                            disabled={colIdx >= columns.length - 1}
                            onClick={() => {
                              if (colIdx >= columns.length - 1) return
                              const next = cloneResumeDocument(draft)
                              next.metadata.layout = moveAcrossColumn(
                                next.metadata.layout,
                                pageIdx,
                                colIdx,
                                colIdx + 1,
                                index,
                              )
                              void commit(next)
                            }}
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            className="text-destructive"
                            aria-label="Remove from layout"
                            onClick={() => {
                              const next = cloneResumeDocument(draft)
                              next.metadata.layout = removeSectionAt(
                                next.metadata.layout,
                                pageIdx,
                                colIdx,
                                index,
                              )
                              void commit(next)
                            }}
                          >
                            ×
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
                <div className="min-w-[200px] flex-1 space-y-2">
                  <Label className="text-xs">Add section to page {pageIdx + 1}</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    value={addSectionId}
                    onChange={(e) => setAddSectionId(e.target.value)}
                  >
                    <option value="">Choose section…</option>
                    {sectionOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label} ({opt.id})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  disabled={!addSectionId}
                  onClick={() => {
                    if (!addSectionId) return
                    const next = cloneResumeDocument(draft)
                    const page = next.metadata.layout[pageIdx] ?? []
                    const targetCol = page.length > 1 ? page.length - 1 : 0
                    next.metadata.layout = addSectionToColumn(
                      next.metadata.layout,
                      pageIdx,
                      targetCol,
                      addSectionId,
                    )
                    void commit(next)
                    setAddSectionId('')
                  }}
                >
                  Add to last column
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {isSaving ? 'Saving…' : 'Changes are saved when you leave a field or adjust the layout.'}
      </p>
    </StepPanel>
  )
}
