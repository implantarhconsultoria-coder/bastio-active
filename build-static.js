const fs = require("fs");
const path = require("path");

const root = __dirname;
const out = path.join(root, "dist");
const files = ["index.html", "catalogo.html", "produto.html", "admin.html"];

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

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of files) {
  copyRecursive(path.join(root, file), path.join(out, file));
}

copyRecursive(path.join(root, "assets"), path.join(out, "assets"));
