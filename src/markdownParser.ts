export class MarkdownParser {
  rules: [RegExp, string][];
  constructor() {
    this.rules = [
      [/^# (.*$)/gm, "<h1>$1</h1>"],
      [/^## (.*$)/gm, "<h2>$1</h2>"],
      [/^### (.*$)/gm, "<h3>$1</h3>"],
      [/```([^`]+)```/g, "<pre><code>$1</code></pre>"],
      [/`([^`]+)`/g, "<code>$1</code>"],
      [/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"],
      [/\*([^*]+)\*/g, "<em>$1</em>"],
      [/^\* (.*$)/gm, "<ul><li>$1</li></ul>"],
      [/^\d\. (.*$)/gm, "<ol><li>$1</li></ol>"],
      [/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'],
      [/^> (.*$)/gm, "<blockquote>$1</blockquote>"],
      [/^(?!<[^>]+>)(?![*#>]|\d\.)(.+)/gm, "<p>$1</p>"],
    ];
  }

  parse(markdown: string) {
    const metadataMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const [_, metaDataString, content] = metadataMatch ?? [];
    let html = content?.trim() ?? markdown.trim();

    const metadata = metaDataString
      ? Object.fromEntries(
          metaDataString.split("\n").map((line) => line.split(":"))
        )
      : {};

    for (const [regex, replacement] of this.rules) {
      html = html.replace(regex, replacement);
    }

    return { html, metadata };
  }
}
