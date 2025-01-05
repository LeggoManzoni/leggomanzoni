/* libraries */
const express = require("express");
const path = require("path");
const fs = require('fs');

/* router */
const router = express.Router();

/* vedo */
router.get("/vedo", (req, res) => {
    const language = req.getLocale();

    res.render(`vedo_${language}`, {
        currentLang: language
    });
});


/* export the module */
module.exports = router;
