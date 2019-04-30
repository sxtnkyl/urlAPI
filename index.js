//package format
const express = require("express");
const dotenv = require("dotenv");
//file import format
const data = require("./fakeData");

const app = express();
dotenv.config();

//the middleware to run between REQUEST and RESPONSE
app.use("/", (req, res, next) => {
  console.log("request got");
  console.log(process.env.TEST);
  res.send(data);
});

app.use("/", (req, res) => {
  console.log("extra work");
});

app.listen(3535, () => {
  console.log("listening on 3535");
});
