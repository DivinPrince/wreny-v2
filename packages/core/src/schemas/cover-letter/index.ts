import { z } from "zod";

import { defaultUrl, urlSchema } from "../resume/shared";

export const coverLetterSenderSchema = z.object({
  name: z.string(),
  email: z.literal("").or(z.string().email()),
  phone: z.string(),
  location: z.string(),
  title: z.string(),
  url: urlSchema,
});

export const coverLetterRecipientSchema = z.object({
  name: z.string(),
  title: z.string(),
  companyName: z.string(),
  location: z.string(),
  email: z.literal("").or(z.string().email()),
});

export const coverLetterContextSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string(),
  jobUrl: z.literal("").or(z.string().url()),
  tone: z.enum(["professional", "confident", "friendly"]).default("professional"),
});

export const coverLetterContentSchema = z.object({
  greeting: z.string(),
  opening: z.string(),
  body: z.array(z.string()),
  closing: z.string(),
  signature: z.string(),
});

export const coverLetterMetadataSchema = z.object({
  template: z.string().default("classic"),
  notes: z.string().default(""),
});

export const coverLetterDocumentSchema = z.object({
  sender: coverLetterSenderSchema,
  recipient: coverLetterRecipientSchema,
  context: coverLetterContextSchema,
  content: coverLetterContentSchema,
  metadata: coverLetterMetadataSchema,
});

export type CoverLetterSender = z.infer<typeof coverLetterSenderSchema>;
export type CoverLetterRecipient = z.infer<typeof coverLetterRecipientSchema>;
export type CoverLetterContext = z.infer<typeof coverLetterContextSchema>;
export type CoverLetterContent = z.infer<typeof coverLetterContentSchema>;
export type CoverLetterMetadata = z.infer<typeof coverLetterMetadataSchema>;
export type CoverLetterDocument = z.infer<typeof coverLetterDocumentSchema>;
export type CoverLetterData = CoverLetterDocument;

export const defaultCoverLetterDocument: CoverLetterDocument = {
  sender: {
    name: "",
    email: "",
    phone: "",
    location: "",
    title: "",
    url: defaultUrl,
  },
  recipient: {
    name: "",
    title: "",
    companyName: "",
    location: "",
    email: "",
  },
  context: {
    jobTitle: "",
    companyName: "",
    jobUrl: "",
    tone: "professional",
  },
  content: {
    greeting: "",
    opening: "",
    body: [],
    closing: "",
    signature: "",
  },
  metadata: {
    template: "classic",
    notes: "",
  },
};

export const coverLetterDataSchema = coverLetterDocumentSchema;
export const defaultCoverLetterData = defaultCoverLetterDocument;

export * from "./sample";
