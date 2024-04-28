const fs = require('fs');
const path = require('path');

function crawlDirectory(directoryPath, fileArray = []) {
    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            crawlDirectory(filePath, fileArray);
        } else {
            if (path.extname(file).toLowerCase() === '.html' || path.extname(file).toLowerCase() === '.htm') {
                fileArray.push(filePath);
            }
        }
    });
    return fileArray;
}

// Example usage:
const htmlFiles = crawlDirectory(path.join(__dirname, "../website"));
console.log(htmlFiles);
