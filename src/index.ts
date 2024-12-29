// TODO: use static bun serve
// TODO: document and compare the performance of this app vs nextjs

import { join } from "node:path";

const server = Bun.serve({
  async fetch(req, server) {
    let path = new URL(req.url).pathname;
    const contentType = path.endsWith(".css") ? "text/css" : "text/html";

    let file = Bun.file(join("./dist", path));
    // this runs if the file exists directly, e.g. /index.html or /style.css
    if (await file.exists())
      return new Response(file, {
        headers: {
          "Content-Type": contentType,
        },
      });
    // this runs if the file does not exist directly, e.g. /blog/index.html
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

console.log(
  `${new Date().toLocaleString()}\nServer is running on ${server.url}`
);
