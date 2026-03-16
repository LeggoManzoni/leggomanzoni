/* libraries */
const express = require("express");
const path = require("path");
const fs = require("fs");

/* router */
const router = express.Router();

/* concordanza */
router.get("/concordanza", (req, res) => {
    res.render("concordanza", {
        title: "Concordanza",
        currentLang: req.getLocale()
    });
});

/* concordance data — serves the prebuilt JSON index */
router.get("/concordanza/data", (req, res) => {
    const filePath = path.join(__dirname, "../data/concordance.json");
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Concordance index not built. Run: npm run build-concordance" });
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath);
});

/* export the module */
module.exports = router;
