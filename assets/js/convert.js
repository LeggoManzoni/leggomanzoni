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
  // fs.writeFileSync(`./quarantana/html/${chapter_id}.html`, transformedXml);
  return transformedXml;
}

function convertXmlToHtmlWithImages(chapter_id) {
  xmlDoc = fs.readFileSync(`./quarantana/${chapter_id}.xml`, 'utf8');
  xslStylesheet = fs.readFileSync(__dirname + '/chapter_with_images.xslt', 'utf8');

  const xmlDocument = xmlParse(xmlDoc);
  const xsltDocument = xmlParse(xslStylesheet);
  const transformedXml = xsltProcess(xmlDocument, xsltDocument);
  // fs.writeFileSync(`./quarantana/html/${chapter_id}.html`, transformedXml);
  return transformedXml;
}


function convertCommentXMLToHtml(authorName, chapterName) {
  try {
    // Read and parse JSON file synchronously
    const data = fs.readFileSync('./commenti/output.json', 'utf8');
    const commentiInfo = JSON.parse(data);

    // Filter for the matching author's name and chapter name
    const matchingEntry = commentiInfo.find(entry => entry.curator === authorName);

    // Check if a matching entry was found
    if (matchingEntry) {
      // Extract the filename and send it as a response
      const authorFile = matchingEntry.filename;

      try {
        // Read XML and XSLT files synchronously
        //const xmlDoc = fs.readFileSync(`./commenti/xml/in_lavorazione/${authorFile}`, 'utf8');
        const xmlDoc = fs.readFileSync(`./commenti/xml/in_lavorazione/${authorFile}/${chapterName}.xml`, 'utf8');
        const xslStylesheet = fs.readFileSync(__dirname + '/comment.xslt', 'utf8');

        const xmlDocument = xmlParse(xmlDoc);
        const xsltDocument = xmlParse(xslStylesheet);
        const transformedXml = xsltProcess(xmlDocument, xsltDocument);

        return transformedXml;
      } catch (error) {
        if (error.code === 'ENOENT') {
          // File not found - this is expected for chapters not yet available
          // Return empty string to trigger the placeholder message, no console log needed
          return "";
        }
        // Re-throw unexpected errors
        throw error;
      }

    } else {
      // No matching entry found - return empty string to trigger placeholder
      return "";
    }
  } catch (err) {
    console.error("An error occurred:", err);
    return "";
  }
}


function convertTranslationXMLToHtml(language, chapterName) {
  try {
    // Read and parse JSON file synchronously
    const data = fs.readFileSync('./translations/output.json', 'utf8');
    const translationsInfo = JSON.parse(data);

    // Filter for the matching author's name
    const matchingEntry = translationsInfo.find(entry => entry.language === language);

    // Check if a matching entry was found
    if (matchingEntry) {
      // Extract the filename and send it as a response
      const authorFile = matchingEntry.filename;

      // Read XML and XSLT files synchronously
      let xmlDoc;
      try {
        xmlDoc = fs.readFileSync(`./translations/${language}/${chapterName}.xml`, 'utf8');
      } catch (error) {
        return "Questo capitolo non è ancora stato digitalizzato."; // Error message for file read failure
      }
      // Check if the XML document is empty
      if (!xmlDoc) {
        console.log("No matching entry found for the specified language.", language);
        return "This language is not available for this chapter yet."; // Message for no XML
      }
      const xslStylesheet = fs.readFileSync(__dirname + '/translation.xslt', 'utf8');

      const xmlDocument = xmlParse(xmlDoc);
      const xsltDocument = xmlParse(xslStylesheet);
      const transformedXml = xsltProcess(xmlDocument, xsltDocument);

      return transformedXml;

    } else {
      console.log("No matching entry found for the specified language.", language);
      return "";
    }
  } catch (err) {
    console.error("An error occurred:", err);
    return "";
  }
}



module.exports = {
  convertXmlToHtml,
  convertCommentXMLToHtml,
  convertXmlToHtmlWithImages,
  convertTranslationXMLToHtml
};
