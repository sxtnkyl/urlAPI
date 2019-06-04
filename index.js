//package format
const express = require("express");
const dotenv = require("dotenv");
const crypto = require("crypto");
//const pg = require("pg");
//object destructuring
const { Pool } = require("pg");
//file import format
//const data = require("./fakeData");

const app = express();
dotenv.config();

//dotn need with obj destructuring
//const Pool = pg.Pool;
const pool = new Pool();

//black box?
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//the middleware to run between REQUEST and RESPONSE
//GET ALL URLS
app.get("/urls", (req, res, next) => {
  pool.query("SELECT * FROM urls;", (err, dbres) => {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      console.log(dbres.rows);
      res.send(dbres.rows);
    }
  });
});

//POST body OBJECT, sets of keyvalue pairs
//body is a data not passed through the url in query strings
app.post("/urls", (req, res) => {
  //auto generate a short url
  //make sure post doesnt already exist in db
  //if true, try again
  //return a response of object {short_url, long_url}
  let hashedUrl = crypto
    .createHash("sha256")
    .update(req.body.long_url, "utf-8")
    .digest("hex");

  //take first 3 and last 3
  const shortenedHashedUrl = hashedUrl.slice(0, 3) + hashedUrl.slice(-3);
  //checks for duplicates
  pool.query(
    `SELECT * FROM urls WHERE short_url=$1;`,
    [shortenedHashedUrl],
    (selectErr, selectRes) => {
      //request selectErr
      if (selectErr) {
        console.log(selectErr);
        res.send(selectErr);
      }
      //input error
      else {
        if (selectRes.rows.length > 0) {
          //have match, handle it
          //CASE1: url already shorteded, return that url
          if (selectRes.rows[0].long_url === req.body.long_url) {
            console.log("this has already been shortened, here it is");
            res.send(selectRes.rows[0]);
          }
          //CASE2: entered longurl is shortened to something already in DB, pure coincidence
          else {
            console.log(
              "what are the odds?!?!? here is the existing match anyways."
            );
            res.send(selectRes.rows[0]);
          }
        } else {
          //not found, make a new insert to DB
          pool.query(
            "INSERT INTO urls (short_url,long_url,visits) VALUES ($1,$2,0) RETURNING *",
            [shortenedHashedUrl, req.body.long_url],
            (insertErr, insertRes) => {
              if (insertErr) {
                res.send(insertErr);
              } else {
                res.send(insertRes.rows[0]);
              }
            }
          );
        }
      }
    }
  );
});

//GET one url by db entry
app.get("/:surl", (req, res) => {
  //console.log(req.params.surl);
  //use this query param to get access to value
  const surl = req.params.surl;
  //param query to protect from SQL attacks
  pool.query(`SELECT * FROM urls WHERE short_url=$1;`, [surl], (err, dbRes) => {
    //request err
    if (err) {
      console.log(err);
      res.send(err);
    }
    //input error
    else {
      if (dbRes.rows.length > 0) {
        // const redirUrl = dbRes.rows[0].long_url.startsWith("http")
        //   ? dbRes.rows[0].long_url
        //   : `https://${dbRes.rows[0].long_url}`;
        // res.redirect(redirUrl);

        res.writeHead(301, {
          Location: `http${res.socket.encrypted ? "s" : ""}://${
            dbRes.rows[0].long_url
          }`
        });

        res.end();
        pool.query(
          "UPDATE urls SET visits = $1 WHERE url_id = $2",
          [dbRes.rows[0].visits++, dbRes.rows[0].url_id],
          (updateErr, updateRes) => {
            console.log("visits updated");
          }
        );
      } else res.send("no entry found");
    }
  });
});

//catch all
//USE triggers on any request type
app.use("/", (req, res, next) => {
  console.log("request got");
  //console.log(process.env.TEST);
  res.send("hello there!");
});

//not middleware, only on start
app.listen(3535, () => {
  console.log("listening on 3535");
});
