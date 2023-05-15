/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* reader */
router.get("/reader", (req, res) => {
    res.render("reader");
});

/* export the module */
module.exports = router;