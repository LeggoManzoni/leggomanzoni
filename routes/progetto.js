/* libraries */
const express = require("express");

/* router */
const router = express.Router();

/* introduzione */
router.get("/progetto", (req, res) => {
    res.render("progetto");
});

/* export the module */
module.exports = router;
