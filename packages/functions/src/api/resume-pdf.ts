import { existsSync } from "node:fs";

import chromium from "@sparticuz/chromium";
import type { ResumeInfo } from "@repo/core/resume";
import { chromium as playwrightChromium } from "playwright-core";

const WINDOWS_BROWSER_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

async function resolveBrowserLaunchOptions() {
  if (process.platform === "win32") {
    const executablePath = WINDOWS_BROWSER_CANDIDATES.find((candidate) =>
      existsSync(candidate),
    );

    if (!executablePath) {
      throw new Error(
        "No local Chromium-based browser was found. Install Chrome or Edge to generate PDFs in local development.",
      );
    }

    return {
      executablePath,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
      headless: true as const,
    };
  }

  const executablePath = await chromium.executablePath();

  return {
    executablePath,
    args: chromium.args,
    headless: true as const,
  };
}

function resolvePdfFormat(resume: ResumeInfo) {
  return resume.data.metadata.page.format === "letter" ? "Letter" : "A4";
}

function resolvePdfPaperSize(resume: ResumeInfo) {
  if (resolvePdfFormat(resume) === "Letter") {
    return {
      widthInches: 8.5,
      heightInches: 11,
    };
  }

  return {
    widthInches: 8.27,
    heightInches: 11.69,
  };
}

async function fetchImageAsset(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  return {
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
    body: Buffer.from(await response.arrayBuffer()),
  };
}

export async function generateResumePdf(args: {
  resume: ResumeInfo;
  cookieHeader?: string | null;
}) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is required for PDF generation.");
  }

  const previewUrl = new URL(
    `/resume-pdf/${args.resume.id}`,
    frontendUrl,
  ).toString();
  const pictureUrl = args.resume.data.basics.picture.url;
  const profileImageAsset =
    pictureUrl.startsWith("http://") || pictureUrl.startsWith("https://")
      ? await fetchImageAsset(pictureUrl).catch(() => null)
      : null;

  const browser = await playwrightChromium.launch(
    await resolveBrowserLaunchOptions(),
  );

  try {
    const context = await browser.newContext({
      colorScheme: "light",
      extraHTTPHeaders: args.cookieHeader
        ? {
            cookie: args.cookieHeader,
          }
        : undefined,
      viewport: {
        width: 1440,
        height: 2200,
      },
    });

    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);

    if (profileImageAsset) {
      await page.route(pictureUrl, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: profileImageAsset.contentType,
          body: profileImageAsset.body,
        });
      });
    }

    await page.goto(previewUrl, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });

    await page.waitForSelector(".resume-pdf-frame .resume-page", {
      state: "visible",
      timeout: 60_000,
    });

    await page.emulateMedia({
      media: "print",
    });

    const paperSize = resolvePdfPaperSize(args.resume);
    const pdfResult = await cdp.send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
      paperWidth: paperSize.widthInches,
      paperHeight: paperSize.heightInches,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
    });
    const pdf = Buffer.from(pdfResult.data, "base64");

    await context.close();

    return pdf;
  } finally {
    await browser.close();
  }
}
