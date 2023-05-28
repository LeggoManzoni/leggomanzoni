/**
 * Converts chapter XML to HTML by applying an XSLT transformation.
 * The source XML is read from a file with the given chapter_id in the quarantana directory.
 * The XSLT stylesheet is read from a file named 'chapter.xslt' in the same directory as the script.
 * The transformed HTML is written to a file with the same name as the chapter_id in the current directory.
 * 
 * @param {string} chapter_id - The identifier of the chapter, used to construct the filenames of the source XML and the output HTML.
 * @returns {string} - The transformed HTML as a string.
 *
 * @example
 * // Convert chapter 2 XML to HTML
 * var html = convertXmlToHtml("cap2");
 * console.log(html);
 */

const path = require("path");
const fs = require('fs');
const { xsltProcess, xmlParse } = require('xslt-processor');


function convertXmlToHtml(chapter_id) {
    xmlDoc = fs.readFileSync(`./quarantana/${chapter_id}.xml`, 'utf8');
    xslStylesheet = fs.readFileSync(__dirname + '/chapter.xslt', 'utf8');

    const xmlDocument = xmlParse(xmlDoc);
    const xsltDocument = xmlParse(xslStylesheet);
    const transformedXml = xsltProcess(xmlDocument, xsltDocument);
    fs.writeFileSync(`./quarantana/html/${chapter_id}.html`, transformedXml);
    return transformedXml;
  }

module.exports = convertXmlToHtml;
