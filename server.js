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

// api
//   .newRequest()
//   .follow("artist")
//   .withRequestOptions({
//     headers: {
//       "X-Xapp-Token": xappToken,
//       Accept: "application/vnd.artsy-v2+json"
//     }
//   })
//   .withTemplateParameters({ id: "andy-warhol" })
//   .getResource(function(error, artist) {
//     console.log(
//       artist.name +
//         "was born in " +
//         artist.birthday +
//         " in " +
//         artist.hometown
//     );
//   });

app.get('/search', (req, res) =>{

  const input = (req.query.search)
  // .split(" ").join("-").toLowerCase();
  console.log(input);

  api
    .newRequest()
    .follow("search")
    // .follow("artworks")
    // .follow("genes")
    .withRequestOptions({
      headers: {
        "X-Xapp-Token": xappToken,
        Accept: "application/vnd.artsy-v2+json"
      }
    })

    .withTemplateParameters({q: input})


    .getResource(function(error, results) {
    console.log(results)
     res.render('results', {results});


    });
})

// app.get('/search', (req, res) =>{

//   const artwork = (req.query.search).split(" ").join("-").toLowerCase();
//   console.log(artwork);

//   api
//     .newRequest()
//     .follow("artwork")
//     .withRequestOptions({
//       headers: {
//         "X-Xapp-Token": xappToken,
//         Accept: "application/vnd.artsy-v2+json"
//       }
//     })

//     .withTemplateParameters({id: artwork})


//     .getResource(function(error, artwork) {
//     console.log(artwork)
//      res.render('results', {artwork});

//     });
// })

// app.get('/search', (req, res) =>{

//   const gene = (req.query.search).split(" ").join("-").toLowerCase();
//   console.log(gene);

//   api
//     .newRequest()
//     .follow("gene")
//     .withRequestOptions({
//       headers: {
//         "X-Xapp-Token": xappToken,
//         Accept: "application/vnd.artsy-v2+json"
//       }
//     })

//     .withTemplateParameters({id: gene})


//     .getResource(function(error, gene) {
//     console.log(gene)
//      res.render('results', {gene});


//     });
// })


app.set("view engine", "ejs");

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});