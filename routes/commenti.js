/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* commenti */
router.get(process.env.URL_PATH + "/commenti", (req, res) => {
    res.render("commenti");
});

/* export the module */
module.exports = router;