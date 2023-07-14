/* libraries */
const express = require("express");
const fs = require('fs');

/* router */
const router = express.Router();

/* commenti */
router.get("/commenti", (req, res) => {
    fs.readFile('output.json', 'utf8', (err, data) => {
        if (err) throw err;
        const jsonData = JSON.parse(data);
        res.render('commenti', { data: jsonData });
      });
});

/* export the module */
module.exports = router;
