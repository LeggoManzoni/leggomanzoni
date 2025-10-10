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



/**
 * Extracts notes from a TEI XML document with their target and targetEnd attributes.
 * Used for grouping comments by their position in the original text.
 *
 * @param {string} xmlContent - The XML content as a string
 * @returns {Array<Object>} - Array of note objects with target, targetEnd, and content properties
 *
 * @example
 * // Extract notes from commentary XML
 * const notes = extractNotesFromXML(xmlContent);
 * // Returns: [{ target: '#w001', targetEnd: '#w005', content: 'text content' }, ...]
 */
function extractNotesFromXML(xmlContent) {
  try {
    // Use regex to extract note elements since DOM parsing isn't working well
    // Support both single and double quotes for attribute values
    const noteRegex = /<note[^>]*xml:id=["']([^"']*)["'][^>]*type=["']comm["'][^>]*target=["']([^"']*)["'](?:[^>]*targetEnd=["']([^"']*)["'])?[^>]*>(.*?)<\/note>/gs;
    const notes = [];

    let match;
    while ((match = noteRegex.exec(xmlContent)) !== null) {
      const target = match[2];
      const targetEnd = match[3] || '';
      const noteContent = match[4];

      // Skip notes without target attributes
      if (!target) {
        continue;
      }

      // Extract text from <ref rend="bold"> and remaining text
      // Pattern: <ref rend="bold">Reference</ref>: text content
      const refMatch = noteContent.match(/<ref[^>]*rend="bold"[^>]*>([^<]*)<\/ref>\s*:\s*(.*)/s);

      let content;
      if (refMatch) {
        const refText = refMatch[1].trim();
        const mainText = refMatch[2].trim();
        content = `${refText}: ${mainText}`;
      } else {
        // No ref tag, just extract plain text
        content = noteContent.replace(/<[^>]*>/g, '').trim();
      }

      notes.push({
        target: target,
        targetEnd: targetEnd,
        content: content
      });
    }

    return notes;
  } catch (error) {
    console.error('Error extracting notes from XML:', error);
    return [];
  }
}

/**
 * Aggregates all available commentaries for a given chapter, grouped by target ID.
 * Reads all curator XML files and organizes comments by their position in the original text.
 *
 * @param {string} chapterName - The chapter identifier (e.g., 'cap1', 'cap2')
 * @returns {Object} - Object with target IDs as keys and arrays of comment data as values
 *
 * @example
 * // Get all comments for chapter 1
 * const comments = aggregateCommentsForChapter('cap1');
 * // Returns: {
 * //   '#w001-#w005': [{ curator: 'Angelini', content: '...' }, { curator: 'Petrocchi', content: '...' }],
 * //   '#w006': [{ curator: 'Angelini', content: '...' }]
 * // }
 */
function aggregateCommentsForChapter(chapterName) {
  try {
    // Read the JSON file to get all available curators
    const data = fs.readFileSync('./commenti/output.json', 'utf8');
    const commentiInfo = JSON.parse(data);

    const aggregatedComments = {};

    // Iterate through each curator
    for (const entry of commentiInfo) {
      const curatorName = entry.curator;
      const authorFile = entry.filename;
      const curatorDate = entry.date || null; // Get the date from output.json

      try {
        // Read the XML file for this curator and chapter
        const xmlPath = `./commenti/xml/in_lavorazione/${authorFile}/${chapterName}.xml`;
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');

        // Extract all notes with their target attributes
        const notes = extractNotesFromXML(xmlContent);

        // Group notes by their target range
        for (const note of notes) {
          // Skip invalid targets (e.g., "quarantana" without file/ID, or targets with "None")
          if (!note.target ||
              note.target === 'quarantana' ||
              note.target.includes('None') ||
              (note.targetEnd && note.targetEnd.includes('None'))) {
            continue;
          }

          // Create a key combining target and targetEnd
          const targetKey = note.targetEnd
            ? `${note.target}-${note.targetEnd}`
            : note.target;

          // Initialize array for this target if it doesn't exist
          if (!aggregatedComments[targetKey]) {
            aggregatedComments[targetKey] = [];
          }

          // Add this comment to the group with date
          aggregatedComments[targetKey].push({
            curator: curatorName,
            date: curatorDate,
            content: note.content,
            target: note.target,
            targetEnd: note.targetEnd
          });
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          // File not found - this curator doesn't have this chapter yet
          // Skip silently (this is expected)
          continue;
        }
        // Log unexpected errors but continue processing other curators
        console.error(`Error processing ${curatorName} for ${chapterName}:`, error);
      }
    }

    return aggregatedComments;
  } catch (error) {
    console.error('Error aggregating comments:', error);
    return {};
  }
}

module.exports = {
  convertXmlToHtml,
  convertCommentXMLToHtml,
  convertXmlToHtmlWithImages,
  convertTranslationXMLToHtml,
  extractNotesFromXML,
  aggregateCommentsForChapter
};
