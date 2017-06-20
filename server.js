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


const api_path = "https://api.artsy.net/api"

traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);
const api = traverson.from(api_path).jsonHal();


// function for search
function search(searchQuery) {
  return new Promise((resolve, reject) => {

  api
    .newRequest()
    .follow("search")
    .withRequestOptions({
      headers: {
        "X-Xapp-Token": xappToken,
        Accept: "application/vnd.artsy-v2+json"
      }
    })
    .withTemplateParameters({q: searchQuery})

    .getResource((error, results) => {
      if(error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}


//function to get info
function getInfo(results) {
  // console.log('getInfo result:', results);
  return new Promise ((resolve, reject) => {
  const details_link = results._embedded.results[0]._links.self.href.substring(api_path.length + 1);
  // console.log(details_link);
  //determines what the search term is (artist, gene, art work etc.)
  let newApi = details_link.split("/")[0];
  newApi = newApi.substring(0,newApi.length-1);

  // more detailed request from the info entered in search bar (2nd request)
  api
    .newRequest()
    //search term is filled in here
    .follow(newApi)
    .withTemplateParameters({id: details_link.split("/")[1]})

    .withRequestOptions({
      headers: {
        "X-Xapp-Token": xappToken,
        Accept: "application/vnd.artsy-v2+json"
        }
    })
    .getResource(function(filtered_error, filtered_results) {
      if(filtered_error) {
        reject(filtered_error);
      } else {
        resolve(filtered_results);
      }
    });
  });
}


// accessing similar artists with the artist id
function getSimilarArtists(results) {
  // console.log('getSimilarArtist result:', results._embedded);
  return new Promise ((resolve, reject) => {
  const artist_id = results._embedded.results[0]._links.self.href.substring(api_path.length + 9);
  // console.log("artist_id", artist_id);
  // const artist_id = results._links.similar_artists.href.substring(api_path.length + 30)

  //handles artist specific searches
    api
      .newRequest()
      .follow('artists')
      .withTemplateParameters({similar_to_artist_id: artist_id})
      .withRequestOptions({
        headers: {
          "X-Xapp-Token": xappToken,
         Accept: "application/vnd.artsy-v2+json"
        }
      })

    .getResource((error, similar_artists)=> {

      const similarArtists = similar_artists._embedded.artists;

      if(error) {
        reject(error);
      } else {
        // resolve(topThreeSimilar);
        resolve(similarArtists);
      }
    });
  });
}


//get request to the api using the search bar (1st request)
app.get('/search', (req, res) => {
  search(req.query.search)
    .then((results) => {
      return Promise.all([
        getInfo(results),
        getSimilarArtists(results)
      ])
    })
    .then(([info, similarArtists]) => {
      // console.log("similar_artist", [info, similarArtists]);
      console.log(similarArtists);
      res.render('results', {info, similarArtists})
    })
    .catch((err) =>{
      console.log(err);
    });
});






app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.static('public'));

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
