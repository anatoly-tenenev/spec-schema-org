import { posix as path } from "node:path";
import { readFileSync } from "node:fs";
import type { UserConfig } from "@11ty/eleventy";

function normalizePath(value: string): string {
  if (value === "") {
    return "/";
  }

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return path.normalize(withLeadingSlash);
}

function toDirectoryPath(value: string): string {
  const normalized = normalizePath(value);

  if (normalized.endsWith("/")) {
    return normalized;
  }

  const lastSlashIndex = normalized.lastIndexOf("/");
  if (lastSlashIndex <= 0) {
    return "/";
  }

  return `${normalized.slice(0, lastSlashIndex)}/`;
}

function extractFencedCodeBlock(content: string, language?: string): string {
  const normalized = content.replace(/\r\n/g, "\n");
  const escapedLanguage = (language ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const languagePattern = escapedLanguage === "" ? "[^\\n]*" : escapedLanguage;
  const matcher = new RegExp(
    `^\\\`\\\`\\\`${languagePattern}\\s*\\n([\\s\\S]*?)\\n\\\`\\\`\\\`\\s*$`,
    "m",
  );
  const match = normalized.match(matcher);

  return match ? match[1] : "";
}

export default function config(eleventyConfig: UserConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/assets": "assets",
  });

  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());

  eleventyConfig.addFilter("readFile", (filePath: string) => {
    return readFileSync(filePath, "utf8");
  });

  eleventyConfig.addFilter("extractFencedCode", (content: string, language?: string) => {
    return extractFencedCodeBlock(content, language);
  });

  eleventyConfig.addFilter("relurl", (target: string, from = "/") => {
    const relativePath = path.relative(toDirectoryPath(from), normalizePath(target));

    return relativePath === "" ? "./" : relativePath;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    templateFormats: ["md", "njk", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
