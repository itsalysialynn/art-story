"use strict";

require("dotenv").load();

const ENV = process.env.ENV || "development";
const PORT = process.env.PORT || 3000;

const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const traverson = require("traverson"),
  JsonHalAdapter = require("traverson-hal"),
  xappToken = process.env.ARTSY_TOLKEN;

const api_path = "https://api.artsy.net/api";

traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);
const api = traverson.from(api_path).jsonHal();

app.get("/search", (req, res) => {
  const input = req.query.search;
  console.log(input);

  api
    .newRequest()
    .follow("search")
    .withRequestOptions({
      headers: {
        "X-Xapp-Token": xappToken,
        Accept: "application/vnd.artsy-v2+json"
      }
    })
    .withTemplateParameters({ q: input })
    .getResource(function(error, results) {
      console.log(JSON.stringify(results));
      const details_link = results._embedded.results[0]._links.self.href.substring(
        api_path.length + 1
      );
      var newApi = details_link.split("/")[0];
      newApi = newApi.substring(0, newApi.length - 1);
      console.log("details_link", newApi);
      api
        .newRequest()
        .follow(newApi)
        .withTemplateParameters({ id: details_link.split("/")[1] })
        .withRequestOptions({
          headers: {
            "X-Xapp-Token": xappToken,
            Accept: "application/vnd.artsy-v2+json"
          }
        })
        .getResource(function(filtered_error, filtered_results) {
          console.log(
            filtered_error,
            "filtered_results",
            JSON.stringify(filtered_results)
          );
          res.render("results", { filtered_results });
        });
      // console.log(results)
    });
});

// app.get("/search", (req, res) => {
//   const artwork = req.query.search.split(" ").join("-").toLowerCase();
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
//     .withTemplateParameters({ id: artwork })
//     .getResource(function(error, artwork) {
//       console.log(artwork);
//       res.render("results", { artwork });
//     });
// });

// app.get("/search", (req, res) => {
//   const gene = req.query.search.split(" ").join("-").toLowerCase();
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
//     .withTemplateParameters({ id: gene })
//     .getResource(function(error, gene) {
//       console.log(gene);
//       res.render("results", { gene });
//     });
// });

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.static("public"));

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
