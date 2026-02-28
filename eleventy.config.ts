import { posix as path } from "node:path";
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

export default function config(eleventyConfig: UserConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/assets": "assets",
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
