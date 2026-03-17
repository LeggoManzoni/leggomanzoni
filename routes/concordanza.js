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

/* concordance data — serves the pre-compressed JSON index */
router.get("/concordanza/data", (req, res) => {
    const gzPath = path.resolve(__dirname, "../data/concordance.json.gz");
    const jsonPath = path.resolve(__dirname, "../data/concordance.json");

    if (fs.existsSync(gzPath) && req.acceptsEncodings("gzip")) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.sendFile(gzPath);
    } else if (fs.existsSync(jsonPath)) {
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.sendFile(jsonPath);
    } else {
        res.status(404).json({ error: "Concordance index not built. Run: npm run build-concordance" });
    }
});

/* export the module */
module.exports = router;
