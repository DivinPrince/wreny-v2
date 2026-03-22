import { z } from "zod";

const urlPairSchema = z.object({
  label: z.string().default(""),
  href: z.string().default(""),
});

/** Compact shape for Gemini structured output; merged into full ResumeDocument */
export const resumePdfExtractSchema = z.object({
  basics: z
    .object({
      name: z.string().default(""),
      headline: z.string().default(""),
      email: z.string().default(""),
      phone: z.string().default(""),
      location: z.string().default(""),
      personalUrl: urlPairSchema.optional(),
    })
    .default({
      name: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
    }),
  summary: z.string().default(""),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        position: z.string().default(""),
        location: z.string().default(""),
        date: z.string().default(""),
        summary: z.string().default(""),
        url: urlPairSchema.optional(),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().default(""),
        studyType: z.string().default(""),
        area: z.string().default(""),
        score: z.string().default(""),
        date: z.string().default(""),
        summary: z.string().default(""),
        url: urlPairSchema.optional(),
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        name: z.string().default(""),
        description: z.string().default(""),
        level: z.number().min(0).max(5).default(1),
        keywords: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  profiles: z
    .array(
      z.object({
        network: z.string().default(""),
        username: z.string().default(""),
        icon: z.string().default(""),
        url: urlPairSchema.optional(),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        description: z.string().default(""),
        date: z.string().default(""),
        summary: z.string().default(""),
        keywords: z.array(z.string()).default([]),
        url: urlPairSchema.optional(),
      }),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().default(""),
        issuer: z.string().default(""),
        date: z.string().default(""),
        summary: z.string().default(""),
        url: urlPairSchema.optional(),
      }),
    )
    .default([]),
});

export type ResumePdfExtract = z.infer<typeof resumePdfExtractSchema>;

export const coverLetterPdfExtractSchema = z.object({
  sender: z
    .object({
      name: z.string().default(""),
      email: z.string().default(""),
      phone: z.string().default(""),
      location: z.string().default(""),
      title: z.string().default(""),
      url: urlPairSchema.optional(),
    })
    .default({
      name: "",
      email: "",
      phone: "",
      location: "",
      title: "",
    }),
  recipient: z
    .object({
      name: z.string().default(""),
      title: z.string().default(""),
      companyName: z.string().default(""),
      location: z.string().default(""),
      email: z.string().default(""),
    })
    .default({
      name: "",
      title: "",
      companyName: "",
      location: "",
      email: "",
    }),
  context: z
    .object({
      jobTitle: z.string().default(""),
      companyName: z.string().default(""),
      jobUrl: z.string().default(""),
      tone: z.enum(["professional", "confident", "friendly"]).default("professional"),
    })
    .default({
      jobTitle: "",
      companyName: "",
      jobUrl: "",
      tone: "professional",
    }),
  content: z
    .object({
      greeting: z.string().default(""),
      opening: z.string().default(""),
      body: z.array(z.string()).default([]),
      closing: z.string().default(""),
      signature: z.string().default(""),
    })
    .default({
      greeting: "",
      opening: "",
      body: [],
      closing: "",
      signature: "",
    }),
});

export type CoverLetterPdfExtract = z.infer<typeof coverLetterPdfExtractSchema>;
