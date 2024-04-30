const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom')
const replaceAll = require("replaceall")

const INPUT_FOLDER = path.join(__dirname, "../website")
const OUTPUT_FOLDER = path.join(__dirname, "../public")

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

function convertRelativePathWithAbsolute(path="") {
    if (path.startsWith("http")) return path

    if (path.startsWith("/")) return `./${replace()}`
}

function adjustHTMLFile(fp = "C:\\Users\\hp\\Documents\\GitHub\\qr-coder-hosting-folder\\website\\index.html") {
    let source = fs.readFileSync(fp, "utf-8")
    let window = new JSDOM(source).window
    let document = window.document

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

    // replace relative root with absolute root of scripts 
    let scriptTags = [...document.querySelectorAll("script")]
    scriptTags.map(x=> {
        if (x.hasAttribute("src")) {
            x.src = convertRelativePathWithAbsolute(x.src)
        }
    })



    // export into target folder
    let html = `<!DOCTYPE html><html>${document.documentElement.innerHTML}</html>`
    fs.writeFileSync(path.join(__dirname, "..", "public", "index.html"), html, "utf-8")
}
adjustHTMLFile()