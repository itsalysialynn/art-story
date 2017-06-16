"use strict";
 require("dotenv").load();
const ENV = process.env.ENV || "development";
const PORT = process.env.PORT || 3000;

const express = require("express");
const app = express();
const bodyParser = require("body-parser");



const traverson = require('traverson'),
    JsonHalAdapter = require('traverson-hal'),
    xappToken = process.env.ARTSY_TOLKEN;



traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);
const api = traverson.from("https://api.artsy.net/api").jsonHal();

api
  .newRequest()
  .follow("artist")
  .withRequestOptions({
    headers: {
      "X-Xapp-Token": xappToken,
      Accept: "application/vnd.artsy-v2+json"
    }
  })
  .withTemplateParameters({ id: "andy-warhol" })
  .getResource(function(error, artist) {
    console.log(
      artist.name +
        "was born in " +
        artist.birthday +
        " in " +
        artist.hometown
    );
  });

app.get('/search', (req, res) =>{

  const artist = (req.query.search).split(" ").join("-").toLowerCase();
  // artist.split(" ").join("-");
  console.log(artist);

  api
    .newRequest()
    .follow("artist")
    .withRequestOptions({
      headers: {
        "X-Xapp-Token": xappToken,
        Accept: "application/vnd.artsy-v2+json"
      }
    })

    .withTemplateParameters({id: artist})


    .getResource(function(error, artist) {
    console.log(artist)
     res.render('results', {artist});


    });
  // res.send(req.query.search);
})

app.set("view engine", "ejs");

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});