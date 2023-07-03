const fs = require('fs');
const path = require('path');
const { XMLParser } = require("fast-xml-parser");

const xmlFolder = './commenti/xml/in_lavorazione/'; 
const jsonOutputFile = './output.json'; 

const xmlFiles = fs.readdirSync(xmlFolder).filter(file => path.extname(file) === '.xml');

const fileInfoList = xmlFiles.map(file => {
  const xmlContent = fs.readFileSync(path.join(xmlFolder, file), 'utf8');
  
  const parser = new XMLParser();
  const jsonObj = parser.parse(xmlContent, {
    attributeNamePrefix: "",
    ignoreAttributes: false,
    ignoreNameSpace: true
  });
  
  const title = jsonObj.TEI.teiHeader.fileDesc.titleStmt.title;
  const author = jsonObj.TEI.teiHeader.fileDesc.sourceDesc.bibl.editor;
  const date = jsonObj.TEI.teiHeader.fileDesc.sourceDesc.bibl.date;
  
  return {
    filename: file,
    title,
    author,
    date
  };
});

fs.writeFileSync(jsonOutputFile, JSON.stringify(fileInfoList, null, 2));
