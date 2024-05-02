const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const replaceAll = require("replaceall");
const { rimrafSync } = require("rimraf");
const { URL } = require("url");

const INPUT_FOLDER = path.join(__dirname, "../in");
const OUTPUT_FOLDER = path.join(__dirname, "../web");
const PUBLIC_FOLDER = path.join(__dirname, "../public");
const HOSTED_PATH =
  "https://cdn.jsdelivr.net/gh/ptk-dev/qr-coder-hosting-folder@main/web/";

function crawlDirectory(directoryPath, htmlArray = [], fileArray = []) {
  const files = fs.readdirSync(directoryPath);
  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      crawlDirectory(filePath, htmlArray, fileArray);
    } else {
      if (
        path.extname(file).toLowerCase() === ".html" ||
        path.extname(file).toLowerCase() === ".htm"
      ) {
        htmlArray.push(filePath);
      } else {
        fileArray.push(filePath);
      }
    }
  });
  return { htmlArray, fileArray };
}

function normalizePath(path) {
  path = path.replace(/\/\/+/g, "//");

  path = path.replace(/^\/|\/$/g, "");

  const parts = path.split(/\//).filter((part) => part);

  return parts.join("/");
}

function convertRelativePathWithAbsolute(_path = "", filePath = "") {
  if (_path.startsWith("http")) return _path;

  if (_path === "/") {
    return HOSTED_PATH;
  }

  if (_path.startsWith("./")) {
    return new URL(
      HOSTED_PATH +
        (() => {
          let fp = filePath.split("/");
          fp.pop();
          return fp.join("/");
        })() +
        _path
    ).href;
  }

  if (_path.startsWith("/")) {
    return new URL(HOSTED_PATH + "/" + _path).href;
  }
  return _path;
}

async function writeFileRecursive(filePath, data, encoding = "utf8") {
  const dirPath = path.dirname(filePath);

  try {
    fs.accessSync(dirPath, fs.constants.F_OK);
  } catch (err) {
    if (err.code === "ENOENT") {
      fs.mkdirSync(dirPath, { recursive: true });
    } else {
      throw err;
    }
  }

  try {
    fs.writeFileSync(filePath, data, encoding);
  } catch (err) {
    throw err;
  }
}

function adjustHTMLFile(fp) {
  let source = fs.readFileSync(fp, "utf-8");
  let window = new JSDOM(source).window;
  let document = window.document;
  let filePath = fp.replace(INPUT_FOLDER, "");

  // remove preloads
  let preloads = [...document.querySelectorAll("[rel=preload]")];
  preloads.map((x) => x.remove());

  // bundle distributed styles
  let styleTags = [...document.querySelectorAll("style")];
  let style = "";
  styleTags.map((x) => {
    style += x.innerHTML;
    x.remove();
  });
  document.head.innerHTML += `<style>${style}</style>`;

  // next generated error fix
  document.documentElement.innerHTML = replaceAll(
    `\`"`,
    ';"',
    document.documentElement.innerHTML
  );

  // replace 'http://localhost:3000' links with hosted path
  document.documentElement.innerHTML = replaceAll(
    `http://localhost:3000`,
    "",
    document.documentElement.innerHTML
  );

  // replace relative root with absolute root of scripts and links and images
  let scriptAndLinkAndImgTags = [
    ...document.querySelectorAll("script"),
    ...document.querySelectorAll("link"),
    ...document.querySelectorAll("img"),
  ];
  scriptAndLinkAndImgTags.map((x) => {
    if (x.hasAttribute("src")) {
      x.src = normalizePath(convertRelativePathWithAbsolute(x.src, filePath));
    }

    if (x.hasAttribute("href")) {
      x.href = normalizePath(convertRelativePathWithAbsolute(x.href, filePath));
    }
  });

  // export into target folder
  let html = `<!DOCTYPE html><html>${document.documentElement.innerHTML}</html>`;
  return {
    html,
  };
}

const { htmlArray, fileArray } = crawlDirectory(INPUT_FOLDER);

function adjustWebPackFile(fp) {
  let source = fs.readFileSync(fp, "utf-8");
  source = source.replace("/_next/", HOSTED_PATH + "_next/");
  return source;
}

// clean the target directory
rimrafSync(OUTPUT_FOLDER);
if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER);

for (let file of htmlArray) {
  let { html } = adjustHTMLFile(file);
  writeFileRecursive(
    path.join(OUTPUT_FOLDER, file.replace(INPUT_FOLDER, "")),
    html,
    "utf-8"
  );
  writeFileRecursive(
    path.join(PUBLIC_FOLDER, file.replace(INPUT_FOLDER, "")),
    `<!DOCTYPE html><script src="/script.js"></script>`,
    "utf-8"
  );
}
for (let file of fileArray) {
  let source;
  if (file.match("webpack")) source = adjustWebPackFile(file);
  writeFileRecursive(
    path.join(OUTPUT_FOLDER, file.replace(INPUT_FOLDER, "")),
    source ?? fs.readFileSync(file, "binary"),
    source ? "utf-8" : "binary"
  );
}
