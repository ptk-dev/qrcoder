(async () => {
  let BASEPATH =
    "https://cdn.jsdelivr.net/gh/ptk-dev/qr-coder-hosting-folder/web";
  let location =
    BASEPATH +
    (window.location.pathname === "/"
      ? "/index.html"
      : window.location.pathname);

  if (!location.endsWith(".html")) location += ".html";
  try {
    let source = await (await fetch(location, { cache: "no-cache" })).text();
    let dom = new DOMParser().parseFromString(source, "text/html");
    document.body.innerHTML = source;


    // Append external scripts and handle async dependencies
    let externalScripts = [...dom.querySelectorAll("script[src]")];
    externalScripts.forEach((script) => {
      let newScript = document.createElement("script");
      newScript.src = script.src;
      // Consider adding async or defer attributes if necessary
      document.body.appendChild(newScript);
    });
    // Evaluate inline scripts
    let inlineScripts = [...dom.querySelectorAll("script:not([src])")];
    inlineScripts.forEach((script) => {
      eval(script.textContent);
    });
  } catch (error) {
    console.error("Error fetching or processing HTML:", error);
  }
})();
