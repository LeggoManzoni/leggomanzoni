/* libraries */
const express = require("express");
const path = require("path");

/* app */
const app = express();

/* views */
app.set("views", [
  path.join(__dirname, "views")
]);
app.set("view engine", "ejs");
app.use("/views", express.static("views"));

/* index */
app.get("/", (req, res) => {
  res.render("index");
});

/* introduzione */
const introduzione = require("./routes/introduzione");
app.use("/", introduzione);

/* port */
const port = 3000;
app.listen(port, () => console.log("Quaranta commenti are ready!"));