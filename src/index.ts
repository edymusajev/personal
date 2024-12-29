// TODO: create separate package to bundle the content
// 1. read and parse all files
// 2. create html files in /dist
// 3. create npm script to bundle the content
// 4. serve these dist files from server as static files
// TODO: use static bun serve
// TODO: document and compare the performance of this app vs nextjs

import { join } from "node:path";

const server = Bun.serve({
  async fetch(req, server) {
    let path = new URL(req.url).pathname;
    const contentType = path.endsWith(".css") ? "text/css" : "text/html";

    let file = Bun.file(join("./dist", path));
    if (await file.exists())
      return new Response(file, {
        headers: {
          "Content-Type": contentType,
        },
      });
    console.log(path);
    return new Response(Bun.file(join("./dist", path + "/index.html")), {
      headers: {
        "Content-Type": "text/html",
      },
    });
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

console.log(`Server is running on ${server.url}`);
