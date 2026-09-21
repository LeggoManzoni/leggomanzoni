/* libraries */
const express = require("express");
const path = require("path");
const fs = require("fs");

/* router */
const router = express.Router();

/* resolve data paths once at startup */
const lociDir = path.resolve(__dirname, "../data/loci");
const indexPath = path.join(lociDir, "index.json");

/**
 * Read the chapter manifest from disk.
 * Returns an empty list rather than throwing, so the page still renders (with
 * its own notice) when the collation has not been built.
 * @returns {Array<Object>} one entry per built chapter
 */
function readManifest() {
    try {
        return JSON.parse(fs.readFileSync(indexPath, "utf8")).chapters || [];
    } catch (err) {
        console.error("collaziono: manifest unreadable:", err.message);
        return [];
    }
}

/* collaziono — the V27/Q40 synoptic viewer */
router.get("/collaziono", (req, res) => {
    res.render("collaziono", {
        chapters: readManifest(),
        currentLang: req.getLocale()
    });
});

/* chapter payload — one file per chapter, loaded on demand */
router.get("/collaziono/data/:chapter", (req, res) => {
    const name = String(req.params.chapter).replace(/[^a-z0-9]/gi, "");
    const file = path.join(lociDir, name + ".json");

    if (!file.startsWith(lociDir) || !fs.existsSync(file)) {
        return res.status(404).json({
            error: "Capitolo non collazionato. Eseguire: scripts/venv/bin/python scripts/collate_tei.py"
        });
    }

    // "no-cache" means revalidate before use, not "do not store": the browser
    // keeps the file but checks the ETag first, so a rebuilt collation reaches
    // readers immediately instead of up to 24h later. Raise to a max-age once
    // the apparatus stops changing.
    res.setHeader("Cache-Control", "public, no-cache");
    res.sendFile(file);
});

/* export the module */
module.exports = router;
