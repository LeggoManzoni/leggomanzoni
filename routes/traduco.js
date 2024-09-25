/* libraries */
const express = require("express");
const path = require("path");
const fs = require('fs');

/* router */
const router = express.Router();

/* traduco */
router.get("/traduco", (req, res) => {
    var chapters = ["Introduzione", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38"]; // da estrarre dinamicamente dai file XML

    const jsonFilePath = 'translations/output.json'; // specify the path to output.json

    // Read and parse JSON file
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send("Unable to read JSON file: " + err);
        } else {
            const translationsInfo = JSON.parse(data);

            // Extract filenames or any other relevant information from the JSON
            let translations = translationsInfo.map(fileInfo => fileInfo.language);

            // Render the view after commenti is populated
            res.render("traduco", {
                chapters: chapters,
                translations: translations,
                defaultChapter: 'intro'
            });
        }
    });
});


/* export the module */
module.exports = router;
