/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* credits */
router.get("/vignette", (req, res) => {
    res.render("vignette", { 
        currentLang: req.getLocale()
    });
});

/* export the module */
module.exports = router;
