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
    let html = markdown;

    for (const [regex, replacement] of this.rules) {
      html = html.replace(regex, replacement);
    }

    // Clean up any adjacent lists of the same type
    html = html.replace(/<\/ul>\s*<ul>/g, "");
    html = html.replace(/<\/ol>\s*<ol>/g, "");

    return html;
  }
}

const parser = new MarkdownParser();

// 1. read the html file as text
// 2. read the markdown file as text
// 3. replace the div with id="content" with the markdown content
// 4. return the new html as a response

const homepage = await Bun.file("./index.html");
const content = await homepage.text();

const readme = await Bun.file("./article.md");
const readmeContent = await readme.text();

const newContent = content.replace("{content}", parser.parse(readmeContent));
console.log(parser.parse(readmeContent));

Bun.serve({
  static: {
    "/": new Response(newContent, {
      headers: {
        "Content-Type": "text/html",
      },
    }),
    // "/style.css": new Response(await Bun.file("./style.css").bytes(), {
    //   headers: {
    //     "Content-Type": "text/css",
    //   },
    // }),
  },
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/style.css") {
      return new Response(await Bun.file("./style.css").bytes(), {
        headers: {
          "Content-Type": "text/css",
        },
      });
    }

    return new Response("Not found", { status: 404 });
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
