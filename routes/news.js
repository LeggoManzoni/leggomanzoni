/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* introduzione */
router.get("/news", (req, res) => {
    const language = req.getLocale();

    res.render(`news_${language}`, {
        currentLang: language
    });
});

/* export the module */
module.exports = router;
