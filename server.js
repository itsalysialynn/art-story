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
  .getResource(function(error, andyWarhol) {
    console.log(
      andyWarhol.name +
        "was born in " +
        andyWarhol.birthday +
        " in " +
        andyWarhol.hometown
    );
  });

app.set("view engine", "ejs");

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
