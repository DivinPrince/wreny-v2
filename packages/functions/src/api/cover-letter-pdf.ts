import { existsSync } from "node:fs";

import chromium from "@sparticuz/chromium";
import type { CoverLetterInfo } from "@repo/core/cover-letter";
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

export async function generateCoverLetterPdf(args: {
  coverLetter: CoverLetterInfo;
  cookieHeader?: string | null;
}) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is required for PDF generation.");
  }

  const previewUrl = new URL(
    `/cover-letter-pdf/${args.coverLetter.id}`,
    frontendUrl,
  ).toString();

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
        height: 1800,
      },
    });

    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);

    await page.goto(previewUrl, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });

    await page.waitForSelector(".cover-letter-pdf-frame .cover-letter-page", {
      state: "visible",
      timeout: 60_000,
    });

    await page.emulateMedia({
      media: "print",
    });

    const pdfResult = await cdp.send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
      paperWidth: 8.5,
      paperHeight: 11,
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
