/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* introduzione */
router.get("/pekino", (req, res) => {
    const language = req.getLocale();

    res.render(`pekino_${language}`, {
        currentLang: language
    });
});


/* export the module */
module.exports = router;
