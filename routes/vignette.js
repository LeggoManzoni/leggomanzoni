/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* credits */
router.get(process.env.URL_PATH + "/vignette", (req, res) => {
    res.render("vignette");
});

/* export the module */
module.exports = router;