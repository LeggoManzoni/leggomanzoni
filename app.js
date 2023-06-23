/* dotenv */
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
};

/* libraries */
const express = require("express");
const path = require("path");
const ejs = require('ejs');
const fs = require('fs');

const { convertXmlToHtml, convertCommentXMLToHtml } = require('./assets/js/convert.js');

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
app.get(process.env.URL_PATH + "/", (req, res) => {
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

/* vignette */
const vignette = require("./routes/vignette");
app.use("/", vignette);

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

app.get('/get-chapter/:chapterName', function (req, res) {
  var chapterName = req.params.chapterName;

  if (chapterName === "Introduzione") {
    chapterName = "intro";
  } else if (chapterName === "Frontespizio") {
    chapterName = "header";
  }
  converted_data = convertXmlToHtml(chapterName);
  res.send(converted_data);
});


app.get('/get-comment/:authorName?', function (req, res) {
  var author = req.params.authorName;

  if (author) {
      try {
          var converted_data = convertCommentXMLToHtml(author);
          res.send(converted_data);
      } catch (error) {
          // Handle errors that might occur during conversion
          console.error(error);
          res.status(500).send('An error occurred while processing your request.');
      }
  } else {
      // Send an empty object if the authorName parameter is not provided
      res.status(200).send("");
  }
});




/* port */
const port = 8000;
app.listen(port, () => console.log(`Quaranta commenti is listening on localhost:${port}${process.env.URL_PATH}`));