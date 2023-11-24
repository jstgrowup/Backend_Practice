const express = require("express");
const app = express();
require("dotenv").config();
let port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("hello world");
});
app.post("/twitter", (request, response) => {
  response.send("post request");
});
app.get("/login", (req, res) => {
  res.send("<h1>please login subham</h1>");
});
app.get("/youtube", (req, res) => {
  res.send("<h2>please login subham</h2>");
});

app.listen(port, () => {
  console.log(`app is listening at ${port} `);
});
