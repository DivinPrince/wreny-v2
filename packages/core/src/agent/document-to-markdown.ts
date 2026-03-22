import type { CoverLetterDocument } from "../schemas/cover-letter";
import type { ResumeDocument } from "../schemas/resume";

export type ResumeMarkdownInput = {
  id: string;
  title: string;
  data: ResumeDocument;
};

export type CoverLetterMarkdownInput = {
  id: string;
  title: string;
  data: CoverLetterDocument;
};

function pushIf(lines: string[], label: string, value: string | undefined) {
  const v = value?.trim();
  if (v) {
    lines.push(`- **${label}:** ${v}`);
  }
}

function formatUrlLink(label: string, href: string): string | undefined {
  const h = href.trim();
  if (!h) {
    return undefined;
  }
  const l = label.trim();
  return l ? `[${l}](${h})` : h;
}

function pushRichBlock(lines: string[], body: string | undefined) {
  const v = body?.trim();
  if (v) {
    lines.push("");
    lines.push(v);
  }
}

function pushEditRefField(lines: string[], section: string, field: string) {
  lines.push("");
  lines.push(`*— For edits: section \`${section}\` · field \`${field}\`*`);
  lines.push("");
}

function pushEditRefItem(lines: string[], section: string, itemId: string) {
  lines.push("");
  lines.push(`*— For edits: section \`${section}\` · item id \`${itemId}\`*`);
  lines.push("");
}

function hiddenItemNote(visible: boolean) {
  return visible ? "" : "\n\n> _This entry is hidden in the document._\n";
}

/** Readable markdown for coach / model context; includes section + item ids for proposeDocumentChanges. */
export function resumeDocumentToMarkdown(input: ResumeMarkdownInput): string {
  const { id, title, data } = input;
  const lines: string[] = [];

  lines.push(`# ${title.trim() || "Resume"}`);
  lines.push("");
  lines.push(`> **Document id** (for tools): \`${id}\``);
  lines.push("");

  const { basics, sections } = data;

  lines.push("## Contact");
  lines.push("");
  pushIf(lines, "Name", basics.name);
  pushIf(lines, "Headline", basics.headline);
  pushIf(lines, "Email", basics.email);
  pushIf(lines, "Phone", basics.phone);
  pushIf(lines, "Location", basics.location);
  const site = formatUrlLink(basics.url.label, basics.url.href);
  pushIf(lines, "Website", site);
  if (basics.picture?.url?.trim()) {
    lines.push("- **Photo:** _(set in editor)_");
  }
  if (basics.customFields.length > 0) {
    lines.push("");
    lines.push("### Extra contact lines");
    lines.push("");
    for (const f of basics.customFields) {
      lines.push(`- **${f.name || "(untitled)"}:** ${f.value || "_(empty)_"}`);
      lines.push(`  *For edits: section \`basics\` · item id \`${f.id}\`*`);
    }
  }
  lines.push("");
  lines.push(
    "*— For edits: section `basics` · scalars: name, headline, email, phone, location, website label & URL*",
  );
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  if (!sections.summary.visible) {
    lines.push("> _Section off in layout._");
    lines.push("");
  }
  const sum = sections.summary.content.trim();
  if (sum) {
    lines.push(sum);
  } else {
    lines.push("_(empty)_");
  }
  pushEditRefField(lines, "summary", "content");

  const orderedStandard: Array<{
    key: keyof typeof sections;
    title: string;
  }> = [
    { key: "profiles", title: "Profiles & links" },
    { key: "experience", title: "Experience" },
    { key: "education", title: "Education" },
    { key: "skills", title: "Skills" },
    { key: "projects", title: "Projects" },
    { key: "certifications", title: "Certifications" },
    { key: "awards", title: "Awards" },
    { key: "publications", title: "Publications" },
    { key: "volunteer", title: "Volunteering" },
    { key: "languages", title: "Languages" },
    { key: "interests", title: "Interests" },
    { key: "references", title: "References" },
  ];

  for (const { key, title: sectionTitle } of orderedStandard) {
    if (key === "summary" || key === "custom") {
      continue;
    }
    const group = sections[key];
    if (!group || !("items" in group)) {
      continue;
    }

    lines.push(`## ${sectionTitle}`);
    lines.push("");
    if (!group.visible) {
      lines.push("> _Section off in layout._");
      lines.push("");
    }
    if (group.items.length === 0) {
      lines.push("_(no entries)_");
      lines.push("");
      continue;
    }

    for (const item of group.items) {
      lines.push(`### ${listItemHeading(key, item)}${hiddenItemNote(item.visible)}`);
      lines.push("");
      pushStandardItemDetails(lines, key, item);
      pushEditRefItem(lines, key, item.id);
    }
  }

  const customKeys = Object.keys(sections.custom).sort((a, b) =>
    (sections.custom[a]?.name ?? a).localeCompare(sections.custom[b]?.name ?? b),
  );
  for (const customId of customKeys) {
    const group = sections.custom[customId];
    if (!group) {
      continue;
    }
    const sectionKey = `custom.${customId}`;
    lines.push(`## ${group.name || "Custom section"}`);
    lines.push("");
    lines.push(`*Section key: \`${sectionKey}\`*`);
    lines.push("");
    if (!group.visible) {
      lines.push("> _Section off in layout._");
      lines.push("");
    }
    if (group.items.length === 0) {
      lines.push("_(no entries)_");
      lines.push("");
      continue;
    }
    for (const item of group.items) {
      lines.push(`### ${item.name || "(untitled)"}${hiddenItemNote(item.visible)}`);
      lines.push("");
      pushIf(lines, "Description", item.description);
      pushIf(lines, "Date", item.date);
      pushIf(lines, "Location", item.location);
      const u = formatUrlLink(item.url.label, item.url.href);
      pushIf(lines, "Link", u);
      if (item.keywords?.length) {
        lines.push(`- **Keywords:** ${item.keywords.join(", ")}`);
      }
      pushRichBlock(lines, item.summary);
      pushEditRefItem(lines, sectionKey, item.id);
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

function listItemHeading(
  section: string,
  item: Record<string, unknown>,
): string {
  switch (section) {
    case "experience":
      return [item.company, item.position].filter(Boolean).join(" — ") || "(role)";
    case "education":
      return (
        [item.institution, item.studyType].filter(Boolean).join(" — ") ||
        "(education)"
      );
    case "projects":
      return String(item.name || "(project)");
    case "skills":
      return String(item.name || "(skill group)");
    case "profiles":
      return String(item.network || "(profile)");
    case "awards":
      return String(item.title || "(award)");
    case "certifications":
      return String(item.name || "(certification)");
    case "publications":
      return String(item.name || "(publication)");
    case "volunteer":
      return (
        [item.organization, item.position].filter(Boolean).join(" — ") ||
        "(volunteer)"
      );
    case "references":
      return String(item.name || "(reference)");
    case "languages":
      return String(item.name || "(language)");
    case "interests":
      return String(item.name || "(interest)");
    default:
      return "(item)";
  }
}

function pushStandardItemDetails(
  lines: string[],
  section: string,
  item: Record<string, unknown>,
) {
  switch (section) {
    case "experience":
      pushIf(lines, "Company", item.company as string);
      pushIf(lines, "Title", item.position as string);
      pushIf(lines, "Location", item.location as string);
      pushIf(lines, "Dates", item.date as string);
      pushIf(
        lines,
        "Link",
        formatUrlLink(
          (item.url as { label?: string })?.label ?? "",
          (item.url as { href?: string })?.href ?? "",
        ),
      );
      pushRichBlock(lines, item.summary as string);
      break;
    case "education":
      pushIf(lines, "School", item.institution as string);
      pushIf(lines, "Degree / type", item.studyType as string);
      pushIf(lines, "Field / area", item.area as string);
      pushIf(lines, "GPA / honors", item.score as string);
      pushIf(lines, "Dates", item.date as string);
      pushIf(
        lines,
        "Link",
        formatUrlLink(
          (item.url as { label?: string })?.label ?? "",
          (item.url as { href?: string })?.href ?? "",
        ),
      );
      pushRichBlock(lines, item.summary as string);
      break;
    case "skills": {
      const lvl = item.level;
      if (typeof lvl === "number") {
        lines.push(`- **Level:** ${lvl} / 5`);
      }
      pushIf(lines, "Details", item.description as string);
      const kw = item.keywords as string[] | undefined;
      if (kw?.length) {
        lines.push(`- **Keywords:** ${kw.join(", ")}`);
      }
      break;
    }
    case "projects":
      pushIf(lines, "Name", item.name as string);
      pushIf(lines, "Subtitle", item.description as string);
      pushIf(lines, "Dates", item.date as string);
      pushIf(
        lines,
        "Link",
        formatUrlLink(
          (item.url as { label?: string })?.label ?? "",
          (item.url as { href?: string })?.href ?? "",
        ),
      );
      {
        const kw = item.keywords as string[] | undefined;
        if (kw?.length) {
          lines.push(`- **Keywords:** ${kw.join(", ")}`);
        }
      }
      pushRichBlock(lines, item.summary as string);
      break;
    case "profiles":
      pushIf(lines, "Network", item.network as string);
      pushIf(lines, "Username / handle", item.username as string);
      pushIf(
        lines,
        "Link",
        formatUrlLink(
          (item.url as { label?: string })?.label ?? "",
          (item.url as { href?: string })?.href ?? "",
        ),
      );
      break;
    case "awards":
      pushIf(lines, "Title", item.title as string);
      pushIf(lines, "Awarded by", item.awarder as string);
      pushIf(lines, "Date", item.date as string);
      pushIf(
        lines,
        "Link",
        formatUrlLink(
          (item.url as { label?: string })?.label ?? "",
          (item.url as { href?: string })?.href ?? "",
        ),
      );
      pushRichBlock(lines, item.summary as string);
      break;
    case "certifications":
      pushIf(lines, "Name", item.name as string);
      pushIf(lines, "Issuer", item.issuer as string);
      pushIf(lines, "Date", item.date as string);
      pushIf(
        lines,
        "Link",
        formatUrlLink(
          (item.url as { label?: string })?.label ?? "",
          (item.url as { href?: string })?.href ?? "",
        ),
      );
      pushRichBlock(lines, item.summary as string);
      break;
    case "publications":
      pushIf(lines, "Title", item.name as string);
      pushIf(lines, "Publisher", item.publisher as string);
      pushIf(lines, "Date", item.date as string);
      pushRichBlock(lines, item.summary as string);
      break;
    case "volunteer":
      pushIf(lines, "Organization", item.organization as string);
      pushIf(lines, "Role", item.position as string);
      pushIf(lines, "Location", item.location as string);
      pushIf(lines, "Dates", item.date as string);
      pushIf(
        lines,
        "Link",
        formatUrlLink(
          (item.url as { label?: string })?.label ?? "",
          (item.url as { href?: string })?.href ?? "",
        ),
      );
      pushRichBlock(lines, item.summary as string);
      break;
    case "references":
      pushIf(lines, "Name", item.name as string);
      pushIf(lines, "Relationship", item.description as string);
      pushIf(
        lines,
        "Link",
        formatUrlLink(
          (item.url as { label?: string })?.label ?? "",
          (item.url as { href?: string })?.href ?? "",
        ),
      );
      pushRichBlock(lines, item.summary as string);
      break;
    case "languages":
      pushIf(lines, "Language", item.name as string);
      pushIf(lines, "Proficiency", item.description as string);
      if (typeof item.level === "number") {
        lines.push(`- **Level:** ${item.level} / 5`);
      }
      break;
    case "interests": {
      pushIf(lines, "Interest", item.name as string);
      const kw = item.keywords as string[] | undefined;
      if (kw?.length) {
        lines.push(`- **Keywords:** ${kw.join(", ")}`);
      }
      break;
    }
    default:
      break;
  }
}

export function coverLetterDocumentToMarkdown(
  input: CoverLetterMarkdownInput,
): string {
  const { id, title, data } = input;
  const lines: string[] = [];
  lines.push(`# ${title.trim() || "Cover letter"}`);
  lines.push("");
  lines.push(`> **Document id** (for tools): \`${id}\``);
  lines.push("");

  lines.push("## Sender");
  lines.push("");
  pushIf(lines, "Name", data.sender.name);
  pushIf(lines, "Title", data.sender.title);
  pushIf(lines, "Email", data.sender.email);
  pushIf(lines, "Phone", data.sender.phone);
  pushIf(lines, "Location", data.sender.location);
  pushIf(
    lines,
    "Website",
    formatUrlLink(data.sender.url.label, data.sender.url.href),
  );
  pushEditRefField(lines, "sender", "name, email, phone, location, title, website");

  lines.push("## Recipient");
  lines.push("");
  pushIf(lines, "Name", data.recipient.name);
  pushIf(lines, "Title", data.recipient.title);
  pushIf(lines, "Company", data.recipient.companyName);
  pushIf(lines, "Location", data.recipient.location);
  pushIf(lines, "Email", data.recipient.email);
  pushEditRefField(lines, "recipient", "name, title, companyName, location, email");

  lines.push("## Job context");
  lines.push("");
  pushIf(lines, "Job title", data.context.jobTitle);
  pushIf(lines, "Company", data.context.companyName);
  pushIf(lines, "Job URL", data.context.jobUrl);
  lines.push(`- **Tone:** ${data.context.tone}`);
  pushEditRefField(lines, "context", "jobTitle, companyName, jobUrl, tone");

  lines.push("## Letter");
  lines.push("");
  pushRichBlock(lines, data.content.greeting);
  lines.push(`*— section \`content\` · field \`greeting\`*`);
  lines.push("");
  pushRichBlock(lines, data.content.opening);
  lines.push(`*— section \`content\` · field \`opening\`*`);
  lines.push("");
  data.content.body.forEach((para, i) => {
    lines.push(`### Body paragraph ${i + 1}`);
    lines.push("");
    pushRichBlock(lines, para);
    lines.push(
      `*— section \`content\` · field \`body\` · paragraph index \`${i}\` (item id)*`,
    );
    lines.push("");
  });
  pushRichBlock(lines, data.content.closing);
  lines.push(`*— section \`content\` · field \`closing\`*`);
  lines.push("");
  pushRichBlock(lines, data.content.signature);
  lines.push(`*— section \`content\` · field \`signature\`*`);
  lines.push("");

  const notes = data.metadata.notes.trim();
  if (notes) {
    lines.push("## Internal notes");
    lines.push("");
    lines.push(notes);
    pushEditRefField(lines, "metadata", "notes");
  }

  return lines.join("\n").trimEnd() + "\n";
}
