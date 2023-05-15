/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* reader */
router.get("/reader", (req, res) => {
    //res.render("reader");
    var chapters = ["1", "2", "3", "4", "5", "6"]; // da estrarre dinamicamente dai file XML
    res.render("reader", {
        chapters: chapters
    });
});

/* export the module */
module.exports = router;