/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* introduzione */
router.get("/progetto", (req, res) => {
    const language = req.getLocale();

    res.render(`progetto_${language}`, {
        currentLang: language
    });
});

/* export the module */
module.exports = router;
