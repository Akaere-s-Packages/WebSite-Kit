import fs from "node:fs";
import path from "node:path";

export default function (eleventyConfig) {
  // Passthrough static assets
  eleventyConfig.addPassthroughCopy({ "src/static": "static" });

  // Expose JSON data at published endpoints for PR preview / public API consumption
  // docs 01/05/06 require packageDetails/<name>.json and data/packageDetails/<name>.json
  eleventyConfig.addPassthroughCopy({ "src/_data/packages.json": "packages.json" });
  eleventyConfig.addPassthroughCopy({ "src/_data/packageDetails": "packageDetails" });

  // After build, also ensure data/ mirror exists for /data/packageDetails/<pkg>.json
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const outputDir = dir.output || "_site";
    const srcDataDir = path.join(outputDir, "packageDetails");
    const destDataDir = path.join(outputDir, "data", "packageDetails");
    if (fs.existsSync(srcDataDir)) {
      fs.mkdirSync(destDataDir, { recursive: true });
      for (const file of fs.readdirSync(srcDataDir)) {
        fs.copyFileSync(path.join(srcDataDir, file), path.join(destDataDir, file));
      }
    }
    const srcPkgs = path.join(outputDir, "packages.json");
    const destPkgs = path.join(outputDir, "data", "packages.json");
    if (fs.existsSync(srcPkgs)) {
      fs.mkdirSync(path.dirname(destPkgs), { recursive: true });
      fs.copyFileSync(srcPkgs, destPkgs);
    }
  });

  // Filters
  eleventyConfig.addFilter("formatBytes", function (bytes) {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return "";
    const b = Number(bytes);
    if (b === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KiB", "MiB", "GiB", "TiB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
  });

  eleventyConfig.addFilter("formatDate", function (dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toISOString().replace("T", " ").substring(0, 16) + " UTC";
  });

  eleventyConfig.addFilter("numberFormat", function (num, decimals = 2) {
    if (num === undefined || num === null || isNaN(num)) return "0.00";
    return Number(num).toFixed(decimals);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
