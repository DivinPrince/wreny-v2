'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Drawer } from 'vaul'
import { X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { useMediaQuery } from '#/hooks/use-media-query'
import { cn } from '#/lib/utils'

/** Aligns with Tailwind `sm` (640px). SSR defaults to desktop to avoid open-state mismatch. */
const SM_MIN_PX = 640

function useSmUp() {
  return useMediaQuery(SM_MIN_PX)
}

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const smUp = useSmUp()
  if (smUp) {
    return <DialogPrimitive.Root data-slot="dialog-root" {...props} />
  }
  return <Drawer.Root data-slot="drawer-root" {...props} />
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  const smUp = useSmUp()
  if (smUp) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
  }
  return <Drawer.Trigger data-slot="drawer-trigger" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/80 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 supports-backdrop-filter:backdrop-blur-xs',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const smUp = useSmUp()

  const closeButton = showCloseButton ? (
    smUp ? (
      <DialogPrimitive.Close data-slot="dialog-close" asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2.5 right-2.5 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </Button>
      </DialogPrimitive.Close>
    ) : (
      <Drawer.Close data-slot="dialog-close" asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2.5 right-2.5 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </Button>
      </Drawer.Close>
    )
  ) : null

  if (smUp) {
    return (
      <DialogPrimitive.Portal data-slot="dialog-portal">
        <DialogOverlay />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn(
            'fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/50 bg-card text-foreground shadow-lg duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            className,
          )}
          {...props}
        >
          <DialogPrimitive.Description className="sr-only">
            Dialog content
          </DialogPrimitive.Description>
          {children}
          {closeButton}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    )
  }

  return (
    <Drawer.Portal>
      <Drawer.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-black/80 supports-backdrop-filter:backdrop-blur-xs',
        )}
      />
      <Drawer.Content
        data-slot="dialog-content"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex min-h-0 max-h-[90dvh] w-full flex-col rounded-t-xl border border-border/50 bg-card pb-[env(safe-area-inset-bottom,0px)] text-foreground shadow-lg outline-none',
          className,
        )}
        {...props}
      >
        <Drawer.Handle className="mx-auto mt-2 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
        <Drawer.Description className="sr-only">Dialog content</Drawer.Description>
        {children}
        {closeButton}
      </Drawer.Content>
    </Drawer.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('border-b border-border/40 px-4 py-3 pr-11', className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const smUp = useSmUp()
  if (smUp) {
    return (
      <DialogPrimitive.Title
        data-slot="dialog-title"
        className={cn('text-sm font-semibold tracking-tight', className)}
        {...props}
      />
    )
  }
  return (
    <Drawer.Title
      data-slot="dialog-title"
      className={cn('text-sm font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  const smUp = useSmUp()
  if (smUp) {
    return <DialogPrimitive.Close data-slot="dialog-close-link" {...props} />
  }
  return <Drawer.Close data-slot="dialog-close-link" {...props} />
}

const DialogPortal = DialogPrimitive.Portal

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
