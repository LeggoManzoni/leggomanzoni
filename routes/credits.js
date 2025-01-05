/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* credits */
router.get("/credits", (req, res) => {
    res.render("credits", { 
        currentLang: req.getLocale()
    });
});

/* export the module */
module.exports = router;
