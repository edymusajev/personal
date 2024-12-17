// TODO: create separate package to bundle the content
// 1. read and parse all files
// 2. create html files in /dist
// 3. create npm script to bundle the content
// 4. serve these dist files from server as static files
// TODO: use static bun serve
// TODO: document and compare the performance of this app vs nextjs

import { Glob } from "bun";

class MarkdownParser {
  rules: [RegExp, string][];
  constructor() {
    // These rules will transform Markdown into HTML
    // The order matters - we process from most specific to most general
    this.rules = [
      // Headers (h1, h2, h3)
      [/^# (.*$)/gm, "<h1>$1</h1>"],
      [/^## (.*$)/gm, "<h2>$1</h2>"],
      [/^### (.*$)/gm, "<h3>$1</h3>"],

      // Code blocks (must come before inline code)
      [/```([^`]+)```/g, "<pre><code>$1</code></pre>"],

      // Inline code
      [/`([^`]+)`/g, "<code>$1</code>"],

      // Bold text
      [/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"],

      // Italic text
      [/\*([^*]+)\*/g, "<em>$1</em>"],

      // Lists (unordered and ordered)
      [/^\* (.*$)/gm, "<ul><li>$1</li></ul>"],
      [/^\d\. (.*$)/gm, "<ol><li>$1</li></ol>"],

      // Links
      [/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'],

      // Blockquotes
      [/^> (.*$)/gm, "<blockquote>$1</blockquote>"],

      // Paragraphs (anything that's not caught by above rules)
      [/^(?!<[^>]+>)(?![*#>]|\d\.)(.+)/gm, "<p>$1</p>"],
    ];
  }

  parse(markdown: string) {
    const metadataMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const [_, metaDataString, content] = metadataMatch ?? [];
    let html = content.trim();

    const metadataString = metaDataString;

    const metadata = metadataString
      ? Object.fromEntries(
          metadataString?.split("\n").map((line) => line.split(":"))
        )
      : {};
    console.log(metadata);

    for (const [regex, replacement] of this.rules) {
      html = html.replace(regex, replacement);
    }

    return {
      html,
      metadata,
    };
  }
}

const parser = new MarkdownParser();

function formatDate(dateString: string): string {
  // Create a Date object from the input string
  const date = new Date(dateString);

  // Use Intl.DateTimeFormat for locale-aware formatting
  // We specify 'en-US' for American English formatting
  // The options object configures which parts of the date to show and how
  // TODO: maybe overengineered?
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long", // "December" instead of "Dec" or "12"
    day: "numeric", // "1" instead of "01"
    year: "numeric", // "2024"
  });

  return formatter.format(date);
}

// 1. read the html file as text
// 2. read the markdown file as text
// 3. replace the div with id="content" with the markdown content
// 4. return the new html as a response

const htmlTemplate = await Bun.file("./src/index.html");
const htmlTemplateContent = await htmlTemplate.text();

const indexContent = await Bun.file("./content/index.md");
const readmeContent = await indexContent.text();

const parsedContent = parser.parse(readmeContent);

const title = `<h1>${parsedContent.metadata.title}</h1>`;
const date = parsedContent.metadata.date
  ? `<time datetime="${parsedContent.metadata.date}">${formatDate(
      parsedContent.metadata.date
    )}</time>`
  : "";
const allContent = `${title}\n${date}\n${parsedContent.html}`;

async function getContentForPath(path: string): Promise<string> {
  // Remove trailing slash and handle root path
  path = path.replace(/\/$/, "") || "/index";
  const markdownPath = `./content/${path}.md`;

  try {
    const markdownFile = await Bun.file(markdownPath);
    return markdownFile.text();
  } catch (error) {
    throw new Error(`Content not found for path: ${path}`);
  }
}

async function getBlogPosts() {
  const glob = new Glob("./content/blog/*.md");
  let posts = [];
  for await (const file of glob.scan(".")) {
    posts.push(file.replace("./content", "").replace(".md", ""));
  }
  console.log(posts);
  return posts;
}

// function to create anchor tags for each blog post
function createBlogPostLinks(posts: string[]) {
  return posts.map((post) => `<li><a href="${post}">${post}</a></li>`);
}
getBlogPosts();

Bun.serve({
  // static: {
  //   "/": new Response(newContent, {
  //     headers: {
  //       "Content-Type": "text/html",
  //     },
  //   }),
  //   // "/style.css": new Response(await Bun.file("./style.css").bytes(), {
  //   //   headers: {
  //   //     "Content-Type": "text/css",
  //   //   },
  //   // }),
  // },
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/style.css") {
      return new Response(await Bun.file("./src/style.css").bytes(), {
        headers: {
          "Content-Type": "text/css",
        },
      });
    }

    if (url.pathname === "/blog") {
      const posts = await getBlogPosts();
      const blogPostLinks = createBlogPostLinks(posts);
      console.log(blogPostLinks);
      const blogContent = `<ul>${blogPostLinks.join("")}</ul>`;
      const content = htmlTemplateContent.replace("{content}", blogContent);
      return new Response(content, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    try {
      const markdownContent = await getContentForPath(url.pathname);
      const parsedContent = parser.parse(markdownContent);

      const title = `<h1>${parsedContent.metadata.title}</h1>`;
      const date = parsedContent.metadata.date
        ? `<time datetime="${parsedContent.metadata.date}">${formatDate(
            parsedContent.metadata.date
          )}</time>`
        : "";

      const allContent = `${title}\n${date}\n${parsedContent.html}`;

      const newContent = htmlTemplateContent
        .replace("{content}", allContent)
        .replace("{title}", `${parsedContent.metadata.title}`);

      return new Response(newContent, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    } catch (error) {
      return new Response("Not found", { status: 404 });
    }
  },
  error(error) {
    return new Response(`${error}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
});
