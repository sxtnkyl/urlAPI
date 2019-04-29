const express = require("express");
const data = require("./fakeData");

const app = express();

//the middleware to run between REQUEST and RESPONSE
app.use("/", (req, res, next) => {
  console.log("request got");
  res.send(data);
});

app.use("/", (req, res) => {
  console.log("extra work");
});

app.listen(3535, () => {
  console.log("listening on 3535");
});
