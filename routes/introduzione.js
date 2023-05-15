/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* introduzione */
router.get("/introduzione", (req, res) => {
    res.render("introduzione");
});

/* export the module */
module.exports = router;