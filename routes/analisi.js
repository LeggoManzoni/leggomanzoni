/* libraries */
const express = require("express");
const fs = require("fs");
const path = require("path");

/* router */
const router = express.Router();

/* analisi page */
router.get("/analisi", (req, res) => {
    res.render("analisi", {
        currentLang: req.getLocale()
    });
});

/* API endpoint for comment analysis data */
router.get("/api/comment-analysis/:chapter", (req, res) => {
    const chapter = req.params.chapter;
    const dataPath = path.join(__dirname, '..', 'data', 'analysis', `comment_analysis_${chapter}.json`);

    if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf-8');
        res.json(JSON.parse(data));
    } else {
        res.status(404).json({ error: 'Analysis data not found for this chapter' });
    }
});

/* export the module */
module.exports = router;
