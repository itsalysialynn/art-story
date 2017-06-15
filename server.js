"use strict";

const ENV = process.env.ENV || "development";
const PORT = process.env.PORT || 3000;

const express = require("express");
const app = express();
const bodyParser = require("body-parser");


const traverson = require('traverson'),
    JsonHalAdapter = require('traverson-hal'),
    xappToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6IiIsImV4cCI6MTQ5ODE2MDIzOSwiaWF0IjoxNDk3NTU1NDM5LCJhdWQiOiI1OTQxZGIxNGIyMDJhMzJlZGMwNjM1YjMiLCJpc3MiOiJHcmF2aXR5IiwianRpIjoiNTk0MmUxZWY5YzE4ZGI1MWQzNWQzZTgwIn0.D7RajUrWnaW_iC6MgMKnRAI0zrrJeXHq7U43YwO6caM';

traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);
const api = traverson.from('https://api.artsy.net/api').jsonHal();

api.newRequest()
  .follow('artist')
  .withRequestOptions({
    headers: {
      'X-Xapp-Token': xappToken,
      'Accept': 'application/vnd.artsy-v2+json'
    }
  })
  .withTemplateParameters({ id: 'andy-warhol' })
  .getResource(function(error, andyWarhol) {
    console.log(andyWarhol.name + 'was born in ' + andyWarhol.birthday + ' in ' + andyWarhol.hometown);
  });

app.set("view engine", "ejs");

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
