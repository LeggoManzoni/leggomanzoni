/* libraries */
const express = require("express");
const path = require("path");
const fs = require('fs');

/* router */
const router = express.Router();

/* confronta */
router.get("/confronta", (req, res) => {
    var chapters = ["Introduzione", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38"];

    const jsonFilePath = 'commenti/output.json';

    // Read and parse JSON file to get available curators
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send("Unable to read JSON file: " + err);
        } else {
            const commentiInfo = JSON.parse(data);

            // Extract curator names for the selector
            // Handle both string and array curator names (for multi-author commentaries)
            let curators = commentiInfo.map(fileInfo => {
                if (Array.isArray(fileInfo.curator)) {
                    // Join array elements, trim each to remove extra spaces
                    return fileInfo.curator.map(name => name.trim()).join(', ');
                }
                return fileInfo.curator;
            });

            // Render the confronta view
            res.render("confronta", {
                chapters: chapters,
                curators: curators,
                commentiInfo: commentiInfo,
                defaultChapter: 'intro',
                currentLang: req.getLocale()
            });
        }
    });
});


/* export the module */
module.exports = router;
