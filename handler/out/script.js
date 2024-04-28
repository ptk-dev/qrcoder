function convertRelativeToAbsolute() {
    const baseUrl = "";
    const elementsWithRelativeUrls = document.querySelectorAll('[src], [href]');

    elementsWithRelativeUrls.forEach(element => {
        const attributeName = element.hasAttribute('src') ? 'src' : 'href';
        const relativeUrl = element.getAttribute(attributeName);
        const absoluteUrl = new URL(relativeUrl, baseUrl).href;
        element.setAttribute(attributeName, absoluteUrl);
    });
}

window.addEventListener('load', convertRelativeToAbsolute);
