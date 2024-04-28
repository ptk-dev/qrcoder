const baseUrl = "https://raw.githubusercontent.com/ptk-dev/qr-coder-hosting-folder/main/website/";
function convertRelativeToAbsolute(document) {
    const elementsWithRelativeUrls = document.querySelectorAll('[src], [href]');

    elementsWithRelativeUrls.forEach(element => {
        const attributeName = element.hasAttribute('src') ? 'src' : 'href';
        const relativeUrl = element.getAttribute(attributeName);
        const absoluteUrl = parseUrl(relativeUrl);
        element.setAttribute(attributeName, absoluteUrl);
    });
}

function parseUrl(url) {
    if (url === "/") url = "index.html"
    let bn = new URL(url, "https://qr-coder.web.app").href.replace("https://qr-coder.web.app", baseUrl)
    return bn
}

async function loadWebpage() {
    const mainUrl = parseUrl(window.location.pathname)
    const source = await (await fetch(mainUrl)).text()
    const doc = new DOMParser().parseFromString(source, "text/html")
    convertRelativeToAbsolute(doc)
    document.documentElement.replaceWith(doc.documentElement)
}
window.addEventListener('load', loadWebpage);