const fs = require("fs");
const path = require("path");

require("./build-static");

const root = __dirname;
const dist = path.join(root, "dist");
const output = path.join(root, ".vercel", "output");
const staticOut = path.join(output, "static");
const htmlFiles = fs.readdirSync(dist).filter((file) => file.endsWith(".html"));

function copyRecursive(source, destination) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(staticOut, { recursive: true });
copyRecursive(dist, staticOut);

const routes = [
  { src: "^/$", dest: "/index.html" },
  { src: "^/assets/(.*)$", dest: "/assets/$1" },
  ...htmlFiles.map((file) => ({
    src: `^/${file.replace(".", "\\.")}$`,
    dest: `/${file}`
  })),
  { src: "^/(.*)$", dest: "/index.html" }
];

fs.writeFileSync(path.join(output, "config.json"), JSON.stringify({ version: 3, routes }, null, 2));
