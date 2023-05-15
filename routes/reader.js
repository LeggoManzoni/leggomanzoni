/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* reader */
router.get("/reader", (req, res) => {
    //res.render("reader");
    var chapters = ["Frontespizio", "Introduzione", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38"]; // da estrarre dinamicamente dai file XML
    res.render("reader", {
        chapters: chapters
    });
});

/* export the module */
module.exports = router;