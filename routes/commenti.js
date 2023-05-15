/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* commenti */
router.get("/commenti", (req, res) => {
    res.render("commenti");
});

/* export the module */
module.exports = router;