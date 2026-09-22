/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* credits — the content now lives as a section of /progetto, so that the
   navigation bar carries one item fewer. Kept as a permanent redirect because
   /credits (and its #scuole / #insegnanti anchors) is linked from outside. */
router.get("/credits", (req, res) => {
    res.redirect(301, "./progetto#credits");
});

/* export the module */
module.exports = router;
