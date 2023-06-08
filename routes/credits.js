/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* credits */
router.get(process.env.URL_PATH + "/credits", (req, res) => {
    res.render("credits");
});

/* export the module */
module.exports = router;