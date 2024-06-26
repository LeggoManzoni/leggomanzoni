/* libraries */
const express = require("express");
const path = require("path");
const fs = require('fs');

/* router */
const router = express.Router();

/* vedo */
router.get("/vedo", (req, res) => {
    res.render("vedo");
});


/* export the module */
module.exports = router;
