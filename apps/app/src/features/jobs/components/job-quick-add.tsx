import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { JobStatus } from "../lib/types"

import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"

import { useCreateJob } from "../lib/queries"

const companyColors = [
  "#4A6EB0",
  "#6B5CA5",
  "#557A5E",
  "#A55C5C",
  "#A5935C",
  "#5C7FA5",
] as const

function getRandomColor() {
  return companyColors[Math.floor(Math.random() * companyColors.length)] ?? "#4A6EB0"
}

type JobQuickAddProps = {
  status: JobStatus
  nextPosition: number
  onCancel: () => void
  onCreated: () => void
}

export function JobQuickAdd({
  status,
  nextPosition,
  onCancel,
  onCreated,
}: JobQuickAddProps) {
  const [companyName, setCompanyName] = useState("")
  const [jobUrl, setJobUrl] = useState("")
  const [step, setStep] = useState<"company" | "url">("company")
  const createJobMutation = useCreateJob()

  const companyColor = useMemo(() => getRandomColor(), [])

  async function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (companyName.trim()) setStep("url")
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobUrl.trim() || !/^https?:\/\//.test(jobUrl)) return

    await createJobMutation.mutateAsync({
      companyName: companyName.trim(),
      jobTitle: "Untitled",
      jobUrl: jobUrl.trim(),
      status,
      position: nextPosition,
      logoColor: companyColor,
      documents: [],
    })
    setCompanyName("")
    setJobUrl("")
    setStep("company")
    onCreated()
  }

  if (step === "company") {
    return (
      <div className="space-y-4">
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Company Name
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={!companyName.trim()}>
              Continue
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Close
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="size-8 rounded-md flex items-center justify-center text-[10px] text-white font-bold"
            style={{ backgroundColor: companyColor }}
          >
            {companyName.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-sm">{companyName}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStep("company")}
        >
          Edit
        </Button>
      </div>
      <form onSubmit={handleUrlSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Job URL</label>
          <Input
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://example.com/job"
            type="url"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={
              createJobMutation.isPending ||
              !jobUrl.trim() ||
              !/^https?:\/\//.test(jobUrl)
            }
          >
            {createJobMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Job"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </form>
    </div>
  )
}
