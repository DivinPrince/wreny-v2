import { z } from "zod";

/**
 * LinkedIn profile JSON from the Relevance Stack webhook (POST `{ url }` + `Authorization`).
 * Response bodies may nest the profile under `data` — see `unwrapWebhookProfileBody` in
 * `packages/functions/src/api/linkedin-profile-import.ts`.
 *
 * `.passthrough()` keeps unknown future keys without failing validation.
 */

const strOrNull = z.union([z.string(), z.null()]).optional();

export const linkedInProfilePayloadEducationSchema = z
  .object({
    activities: strOrNull,
    date_range: strOrNull,
    degree: strOrNull,
    end_month: z.union([z.string(), z.number(), z.null()]).optional(),
    end_year: z.union([z.string(), z.number(), z.null()]).optional(),
    field_of_study: strOrNull,
    school: strOrNull,
    school_id: strOrNull,
    school_linkedin_url: strOrNull,
    school_logo_url: strOrNull,
    start_month: z.union([z.string(), z.number(), z.null()]).optional(),
    start_year: z.union([z.string(), z.number(), z.null()]).optional(),
  })
  .passthrough();

export const linkedInProfilePayloadExperienceSchema = z
  .object({
    company: strOrNull,
    company_id: strOrNull,
    company_linkedin_url: strOrNull,
    company_logo_url: strOrNull,
    company_website: strOrNull,
    date_range: strOrNull,
    description: strOrNull,
    duration: strOrNull,
    end_month: z.union([z.string(), z.number(), z.null()]).optional(),
    end_year: z.union([z.string(), z.number(), z.null()]).optional(),
    is_current: z.boolean().optional().nullable(),
    job_type: strOrNull,
    location: strOrNull,
    skills: strOrNull,
    start_month: z.union([z.string(), z.number(), z.null()]).optional(),
    start_year: z.union([z.string(), z.number(), z.null()]).optional(),
    title: strOrNull,
  })
  .passthrough();

export const linkedInProfilePayloadSchema = z
  .object({
    about: strOrNull,
    city: strOrNull,
    company: strOrNull,
    company_description: strOrNull,
    company_domain: strOrNull,
    company_employee_count: z.number().optional().nullable(),
    company_employee_range: strOrNull,
    company_industry: strOrNull,
    company_linkedin_url: strOrNull,
    company_logo_url: strOrNull,
    company_website: strOrNull,
    company_year_founded: strOrNull,
    connection_count: z.number().optional().nullable(),
    country: strOrNull,
    current_company_join_month: z.number().optional().nullable(),
    current_company_join_year: z.number().optional().nullable(),
    current_job_duration: strOrNull,
    educations: z.array(linkedInProfilePayloadEducationSchema).optional(),
    email: strOrNull,
    experiences: z.array(linkedInProfilePayloadExperienceSchema).optional(),
    first_name: strOrNull,
    follower_count: z.number().optional().nullable(),
    full_name: strOrNull,
    headline: strOrNull,
    hq_city: strOrNull,
    hq_country: strOrNull,
    hq_region: strOrNull,
    is_creator: z.boolean().optional().nullable(),
    is_influencer: z.boolean().optional().nullable(),
    is_premium: z.boolean().optional().nullable(),
    is_verified: z.boolean().optional().nullable(),
    job_title: strOrNull,
    languages: z.array(z.unknown()).optional(),
    last_name: strOrNull,
    linkedin_url: strOrNull,
    location: strOrNull,
    phone: strOrNull,
    profile_id: strOrNull,
    profile_image_url: strOrNull,
    public_id: strOrNull,
    school: strOrNull,
    state: strOrNull,
    urn: strOrNull,
  })
  .passthrough();

export type LinkedInProfilePayloadEducation = z.infer<
  typeof linkedInProfilePayloadEducationSchema
>;
export type LinkedInProfilePayloadExperience = z.infer<
  typeof linkedInProfilePayloadExperienceSchema
>;
export type LinkedInProfilePayload = z.infer<typeof linkedInProfilePayloadSchema>;
