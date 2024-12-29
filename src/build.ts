import { mkdir } from "fs/promises";
import { join } from "path";
import { Glob, write } from "bun";
import { MarkdownParser } from "./markdownParser";

const CONTENT_DIR = "./content";
const OUTPUT_DIR = "./dist";

async function buildSite() {
  const parser = new MarkdownParser();
  const template = await Bun.file("./src/index.html").text();

  // Create dist directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Copy static assets
  await write(
    join(OUTPUT_DIR, "style.css"),
    await Bun.file("./src/style.css").text()
  );

  // Process all markdown files
  const glob = new Glob("**/*.md");
  for await (const file of glob.scan(CONTENT_DIR)) {
    const content = await Bun.file(join(CONTENT_DIR, file)).text();
    const { html, metadata } = parser.parse(content);

    const outputPath = join(OUTPUT_DIR, file.replace(".md", ".html"));
    await mkdir(join(OUTPUT_DIR, file.split("/").slice(0, -1).join("/")), {
      recursive: true,
    });

    const page = template
      .replace("{content}", html)
      .replace("{title}", metadata.title || "");

    await write(outputPath, page);

    console.log(`${outputPath}`);
  }
}

// Run build
buildSite().catch(console.error);
