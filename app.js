/* libraries */
const express = require("express");
const path = require("path");
const ejs = require('ejs');
const fs = require('fs');

/* app */
const app = express();

/* static files */
app.use("/assets", express.static("assets"));

/* views */
app.set("views", [
  path.join(__dirname, "views")
]);
app.set("view engine", "ejs");
app.use("/views", express.static("views"));

/* index */
app.get("/", (req, res) => {
  var arrayN = ["1", "2", "3"];
  res.render("index", {
    arrayN: arrayN
  });
});

/* introduzione */
const introduzione = require("./routes/introduzione");
app.use("/", introduzione);

/* commenti */
const commenti = require("./routes/commenti");
app.use("/", commenti);

/* reader */
const reader = require("./routes/reader");
app.use("/", reader);

/* credits */
const credits = require("./routes/credits");
app.use("/", credits);

/* prova estrazione id */
function extractIds(html) {
  const idArray = [];
  const regex = /<span[^>]*id=["']([^"']+-[^"']+)["'][^>]*>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    idArray.push(id.split("-")[1]); //all the ids are "2b-01"; if [0] it would print only 2b
  }

  return idArray;
  
};

app.get('/extract-ids', (req, res) => {
  fs.readFile('./quarantana/html/cap1.html', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the EJS file:', err);
      res.status(500).send('Error reading the EJS file');
      return;
    }

    const renderedHtml = ejs.render(data);
    const idArray = extractIds(renderedHtml);

    res.json(idArray);
   
  });
});

/* 
app.get('/extract-ids', (req, res) => {
  fs.readFile('./views/reader.ejs', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the EJS file:', err);
      res.status(500).send('Error reading the EJS file');
      return;
    }

    const renderedHtml = ejs.render(data);
    const idArray = extractIds(renderedHtml);

    res.json(idArray);
   
  });
});
*/

/* port */
const port = 8000;
app.listen(port, () => console.log(`Quaranta commenti is listening on localhost:${port}`));

// Function for converting XML to HTML

const { DOMParser, XMLSerializer } = require('xmldom'); // import the necessary modules from the 'xmldom' package

function convertXmlToHtml(xmlFilePath, htmlFilePath) { //xmlFilePath (the path to the XML file) and htmlFilePath (the desired path for the generated HTML file).
  
  const xmlString = fs.readFileSync(xmlFilePath, 'utf8'); //The XML file is read synchronously using fs.readFileSync. The content of the file is stored in the xmlString variable.

  const parser = new DOMParser(); // Create a new DOMParser

  const xmlDoc = parser.parseFromString(xmlString, 'quarantana/cap2.xml');  // Parse the XML string to a Document object

  const htmlDoc = new DOMParser().parseFromString('<html></html>', 'text/html'); // Create a new HTML document

  function convertElement(xmlElement, htmlParent) { // Convert XML elements to HTML elements recursively
                                                    
    const htmlElement = htmlDoc.createElement(xmlElement.nodeName);

    // Convert XML attributes to HTML attributes
    const attributes = xmlElement.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes.item(i);
      htmlElement.setAttribute(attr.nodeName, attr.nodeValue);
    }

    // Convert child elements
    for (let i = 0; i < xmlElement.childNodes.length; i++) {
      const child = xmlElement.childNodes.item(i);
      if (child.nodeType === 1) {
        convertElement(child, htmlElement);
      } else if (child.nodeType === 3) {
        const textNode = htmlDoc.createTextNode(child.textContent);
        htmlElement.appendChild(textNode);
      }
    }

    htmlParent.appendChild(htmlElement);
  }

  // Convert the root XML element to the root HTML element
  convertElement(xmlDoc.documentElement, htmlDoc.documentElement);

  // Serialize the HTML document to an HTML string
  const htmlString = new XMLSerializer().serializeToString(htmlDoc);

  // Write the HTML string to a new HTML file
  fs.writeFileSync(htmlFilePath, htmlString, 'utf8');
}

// Example usage
const xmlFilePath = path.join(__dirname, 'quarantana/cap2.xml');
const htmlFilePath = path.join(__dirname, 'quarantana/html/cap2.html');

//variabili
convertXmlToHtml('quarantana/cap2.xml', 'quarantana/html/cap2.html');
