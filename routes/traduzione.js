/* libraries */
const express = require("express");
const fs = require('fs');

/* router */
const router = express.Router();

/* commenti */
router.get("/traduzione", (req, res) => {
    fs.readFile('./translations/output.json', 'utf8', (err, data) => {
        if (err) throw err;
        const jsonData = JSON.parse(data);
        
        // Filter out entries where the language ends with 's'
        const filteredData = jsonData.filter(item => !item.language.endsWith('s'));
        
        res.render('traduzione', { 
            data: filteredData,
            currentLang: req.getLocale()
        });
    });
});

/* export the module */
module.exports = router;
