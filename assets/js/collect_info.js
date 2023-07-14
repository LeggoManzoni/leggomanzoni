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
  
  const title = jsonObj.TEI.teiHeader.fileDesc.sourceDesc.bibl.title;
  const author = jsonObj.TEI.teiHeader.fileDesc.sourceDesc.bibl.author;
  const curator = jsonObj.TEI.teiHeader.fileDesc.sourceDesc.bibl.editor;
  const date = jsonObj.TEI.teiHeader.fileDesc.sourceDesc.bibl.date;
  const city = jsonObj.TEI.teiHeader.fileDesc.sourceDesc.bibl.pubPlace;
  const publisher = jsonObj.TEI.teiHeader.fileDesc.sourceDesc.bibl.publisher;
  const marcatura = jsonObj.TEI.teiHeader.fileDesc.titleStmt.respStmt;

  
  return {
    filename: file,
    title,
    author,
    curator,
    date,
    city,
    publisher,
    marcatura
  };
});

fs.writeFileSync(jsonOutputFile, JSON.stringify(fileInfoList, null, 2));
