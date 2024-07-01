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
        res.render('traduzione', { data: jsonData });
      });
});

/* export the module */
module.exports = router;
