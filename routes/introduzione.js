/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* introduzione */
router.get(process.env.URL_PATH + "/introduzione", (req, res) => {
    res.render("introduzione");
});

/* export the module */
module.exports = router;