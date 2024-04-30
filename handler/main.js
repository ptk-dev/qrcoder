const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom')
const replaceAll = require("replaceall")
const { rimrafSync } = require("rimraf")

const INPUT_FOLDER = path.join(__dirname, "../website")
const OUTPUT_FOLDER = path.join(__dirname, "../public")
const HOSTED_PATH = "https://cdn.jsdelivr.net/gh/ptk-dev/qr-coder-hosting-folder@main/website/"

function crawlDirectory(directoryPath, htmlArray = [], fileArray = []) {
    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            crawlDirectory(filePath, htmlArray, fileArray);
        } else {
            if (path.extname(file).toLowerCase() === '.html' || path.extname(file).toLowerCase() === '.htm') {
                htmlArray.push(filePath);
            } else {
                fileArray.push(filePath)
            }
        }
    });
    return { htmlArray, fileArray };
}

function convertRelativePathWithAbsolute(_path = "", filePath = "") {
    if (_path.startsWith("http")) return _path

    if (_path === "/") {
        return HOSTED_PATH
    }

    if (_path.startsWith("/")) {
        return HOSTED_PATH + "/" + _path
    }
    return _path
}

async function writeFileRecursive(filePath, data, encoding = 'utf8') {
    const dirPath = path.dirname(filePath);

    try {
        fs.accessSync(dirPath, fs.constants.F_OK);
    } catch (err) {
        if (err.code === 'ENOENT') {
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
    let source = fs.readFileSync(fp, "utf-8")
    let window = new JSDOM(source).window
    let document = window.document
    let filePath = fp.replace(INPUT_FOLDER, "")

    // remove preloads
    let preloads = [...document.querySelectorAll("[rel=preload]")]
    preloads.map(x => x.remove())

    // bundle distributed styles
    let styleTags = [...document.querySelectorAll("style")]
    let styles = ''
    styleTags.map(x => { styles += x.innerHTML; x.remove() })
    document.head.innerHTML += `<style>${styles}</style>`

    // next generated error fix
    document.documentElement.innerHTML = replaceAll(`\`"`, ";\"", document.documentElement.innerHTML)

    // replace 'http://localhost:3000' links with hosted path
    document.documentElement.innerHTML = replaceAll(`http://localhost:3000`, "", document.documentElement.innerHTML)

    // replace relative root with absolute root of scripts and links
    let scriptAndLinkTags = [...document.querySelectorAll("script"), ...document.querySelectorAll("link")]
    scriptAndLinkTags.map(x => {
        if (x.hasAttribute("src")) {
            x.src = convertRelativePathWithAbsolute(x.src, filePath)
        }

        if (x.hasAttribute("href")) {
            x.href = convertRelativePathWithAbsolute(x.href, filePath)
        }
    })



    // export into target folder
    let html = `<!DOCTYPE html><html>${document.documentElement.innerHTML}</html>`
    writeFileRecursive(path.join(__dirname, "..", "public", fp.replace(INPUT_FOLDER, "") + ".txt"), html, "utf-8")
    writeFileRecursive(path.join(__dirname, "..", "public", fp.replace(INPUT_FOLDER, "")), html, "utf-8")
}


const { htmlArray, fileArray } = crawlDirectory(INPUT_FOLDER)

// clean the target directory
rimrafSync(OUTPUT_FOLDER)
if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER)

for (let file of htmlArray) {
    adjustHTMLFile(file)
}
for (let file of fileArray) {
    writeFileRecursive(
        path.join(__dirname, "..", "public", file.replace(INPUT_FOLDER, "")),
        fs.readFileSync(file, "binary"),
        "binary"
    )
}