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

        console.log(filtered_error, "filtered_results", filtered_results)
        res.render('results', {filtered_results: map_filtered_results(filtered_results)});
        });

    });
})

function map_filtered_results(filtered_results){
  if (!Array.isArray(filtered_results)){
    filtered_results = [filtered_results]
  }
 return filtered_results.map(function(x){
  return   {id: x.id, content: x.name || x.title, start: x.birthday || x.date.substring(0,4)}
 })
}

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.static("public"));

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
