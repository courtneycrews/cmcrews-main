import express from "express";
import * as utils from "./utils/utils.js";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

const app = express();
app.use(cors());
const port = 3000;
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));

// Route for Home Page
app.get("/", (req, res) => {
  res.render("index.ejs");
});

// Route for Contact Page
app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

// Route for Temp Page
app.get("/temp", (req, res) => {
  res.render("temp.ejs");
});

// Route for Mantic Artwork Page
app.get("/mantic", (req, res) => {
  res.render("mantic.ejs");
});

// Route for Contact Form Submission
app.post("/mail", async (req, res) => {
  await utils
  .sendMessage(req.body.sub, req.body.txt)
  .then(() => {
    res.send({ result: "Message has been sent!" });
  })
  .catch(() => {
    res.send({ result: "failure" });
  });
});

// Middleware to handle 404 errors
app.use((req, res, next) => {
  res.status(404).render("error.ejs");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("error.ejs", { error: err });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});