"use strict";

require("dotenv").load();

const ENV = process.env.ENV || "development";
const PORT = process.env.PORT || 3000;

const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const wikipedia = require("./lib/wikipedia");

const traverson = require("traverson"),
  JsonHalAdapter = require("traverson-hal"),
  xappToken = process.env.ARTSY_TOLKEN;

const Fiber = require('fibers');


// const wikipediajs = require('./public/scripts/wikipedia.js');

const api_path = "https://api.artsy.net/api";

traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);
const api = traverson.from(api_path).jsonHal();

// For debugging
function logStep(label) {
  return function logIt(data) {
    console.log("\n\n*** LOGSTEP: ", label);
    console.log(JSON.stringify(data, null, 2));
    return data;
  };
}

// Promise.map polyfill
Promise.map = (arr, callback) => Promise.all(arr.map(callback));

// Function for initial search
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
      .withTemplateParameters({ q: searchQuery })
      .getResource((error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
  });
}

// Function to get info about search query
function getInfo(results) {
  return new Promise((resolve, reject) => {
    if (
      !results ||
      !results._embedded ||
      !results._embedded.results ||
      !results._embedded.results[0]._links ||
      !results._embedded.results[0]._links.self
    ) {
      reject("Error, please enter a valid artist or artwork");
      return;
    }

    const details_link = results._embedded.results[0]._links.self.href.substring(
      api_path.length + 1
    );

    //determines what the search term is (artist, gene, art work etc.)
    let newApi = details_link.split("/")[0];
    newApi = newApi.substring(0, newApi.length - 1);

    // more detailed request from the info entered in search bar (2nd request)
    api
      .newRequest()
      //search term is filled in here
      .follow(newApi)
      .withTemplateParameters({ id: details_link.split("/")[1] })
      .withRequestOptions({
        headers: {
          "X-Xapp-Token": xappToken,
          Accept: "application/vnd.artsy-v2+json"
        }
      })
      .getResource(function(filtered_error, filtered_results) {
        if (filtered_error) {
          reject(filtered_error);
        } else {
          resolve({ type: newApi, info: filtered_results });
        }
      });
  });
}

// Accesses the artist's artworks using the artist id
function getArtistsArtwork(results) {
  if (results.birthday === "") {
    reject("Error, please enter a valid artist or artwork");
    return;
  }

  return new Promise((resolve, reject) => {
    const artist_id = results.id;

    // handles artist specific searches
    api
      .newRequest()
      .follow("artworks")
      .withTemplateParameters({ artist_id: artist_id })
      .withRequestOptions({
        headers: {
          "X-Xapp-Token": xappToken,
          Accept: "application/vnd.artsy-v2+json"
        }
      })
      .getResource((error, artists_artworks) => {
        const artistsArtworks = artists_artworks._embedded.artworks;
        if (error) {
          reject(error);
        } else {
          resolve(artistsArtworks);
        }
      });
  });
}

// gets an artworks artist using the artwork id
function getArtworksArtist(results) {

  return new Promise((resolve, reject) => {
    const artwork_id = results.id;

    // handles artwork specific searches
    api
      .newRequest()
      .follow("artists")
      .withTemplateParameters({ artwork_id: artwork_id })
      .withRequestOptions({
        headers: {
          "X-Xapp-Token": xappToken,
          Accept: "application/vnd.artsy-v2+json"
        }
      })
      .getResource((error, artworks_artist) => {
        const artworksArtist = artworks_artist._embedded.artists;
        const imageLink = results._links.image.href;
        const largeImage = imageLink.replace("{image_version}", "large");
        if (error) {
          reject(error);
        } else {
          resolve({
            id: results.id,
            content: "&#9679" + results.title,
            artist: artworksArtist.name,
            start: results.date.match(/\d+/)[0],
            medium: results.medium,
            thumbnail: largeImage,
            group: "artwork",
            type: "point"
          });
        }
      });
  });
}

// function getArtworksArtist2(results) {
//  new Promise((resolve, reject) => {
//   const artwork_id = results.id;
//   let artworksArtist
//   api
//     .newRequest()
//     .follow("artists")
//     .withTemplateParameters({ artwork_id: artwork_id })
//     .withRequestOptions({
//       headers: {
//         "X-Xapp-Token": xappToken,
//         Accept: "application/vnd.artsy-v2+json"
//       }
//     })
//     .getResource((error, artworks_artist) => {
//       artworksArtist = artworks_artist._embedded.artists;

//   });
// }

// Accesses similar artists with the artist id
function getSimilarArtists(results) {
  return new Promise((resolve, reject) => {
    const artist_id = results.id;

    //handles artist specific searches
    api
      .newRequest()
      .follow("artists")
      .withTemplateParameters({ similar_to_artist_id: artist_id })
      .withRequestOptions({
        headers: {
          "X-Xapp-Token": xappToken,
          Accept: "application/vnd.artsy-v2+json"
        }
      })
      .getResource((error, similar_artists) => {
        const similarArtists = similar_artists._embedded.artists;
        if (error) {
          reject(error);
        } else {
          // console.log("similarArtists: ", similarArtists);
          resolve(similarArtists);
        }
      });
  });
}

// Accesses similar artworks with the artwork id
function getSimilarArtworks(results) {
  return new Promise((resolve, reject) => {
    const artwork_id = results.id;

    //handles artist specific searches
    api
      .newRequest()
      .follow("artworks")
      .withTemplateParameters({ similar_to_artwork_id: artwork_id })
      .withRequestOptions({
        headers: {
          "X-Xapp-Token": xappToken,
          Accept: "application/vnd.artsy-v2+json"
        }
      })
      .getResource((error, similar_artworks) => {
        const similarArtworks = similar_artworks._embedded.artworks;
        if (error) {
          reject(error);
        } else {
          const similarArtworks = similar_artworks._embedded.artworks;
          // console.log("similarArtworks: ", similarArtworks);
          resolve(similarArtworks);
        }
      });
  });
}

// Gets each artist ready for Vis
function map_artists(artists) {
  console.log("artist", artist)
  return (
    Promise.resolve(artists)
      .then(artists => artists.map(normalizeBirthday).filter(has_birthday))
      .then(updateArtistsFromWiki)
      .then(artists => artists.map(artistForVis))
      // .then(logStep("after filtering artists"))
      .catch(err => {
        console.error("map_artists failure");
        console.error(err);
        return [];
      })
  );
}

// Gets artist info from wiki
function getArtistFromWiki(artist) {
  return new Promise((resolve, reject) => {
    wikipedia.getData(
      "http://en.wikipedia.org/wiki/" + modifyNameForWiki(artist),
      resolve,
      reject
    );
  });
}

// Gets info from wiki and takes death day (if present)
// If death day is not present, takes the min of (artist's birthday + 75) or current year
function updateArtistsFromWiki(artists) {
  return Promise.map(artists, artist =>
    getArtistFromWiki(artist)
      .catch(console.error)
      .then(wikiData => {
        // console.log("ARTIST AND WIKIDATA *************** ", { artist, wikiData });
        let endDates = wikiData.summary.endDates;
        artist.end = normalizeDeathday(endDates);
        return artist;
      })
      .catch(err => {
        let thisYear = new Date().getFullYear();
        let artistBirthday = Number(artist.birthday);
        let endDate = Math.min(artistBirthday + 75, thisYear);

        artist.end = "" + endDate;
        return artist;
      })
  );
}

// Gets artist ready to send to Vis
function artistForVis(artist) {
  const imageLink = artist._links.image.href;
  const largeImage = imageLink.replace("{image_version}", "large");
  return {
    id: artist.id,
    content: artist.name,
    start: artist.birthday,
    end: artist.end,
    thumbnail: largeImage,
    group: "artist"
  };
}

// Gets each artwork ready for Vis
function map_artworks(artworks) {

    if (!Array.isArray(artworks)) {
    artworks = [artworks];
  }
  const mappedArtworks = artworks.filter(has_date).map(function(x) {
    // const imageLink = x._links.image.href;
    // const largeImage = imageLink.replace("{image_version}", "large");
    getArtworksArtist(x)
  });
 }

// Flattens arrays of similar artists, artworks, and searched artist
function flatten(arr) {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(
      Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
    );
  }, []);
}

// Checks if artist has birthday
function has_birthday(x) {
  return !!x.birthday;
}

// Checks if artist has death day
function hasDeathDay(artist) {
  return !!artist.end;
}

// Normalizes birthday so it is only a year
function normalizeBirthday(artist) {
  if (artist.birthday) {
    var m = artist.birthday.match(/\d{3,4}/);
    if (m) {
      artist.birthday = m[0];
    } else {
      artist.birthday = null;
    }
  }
  return artist;
}

// Normalizes death day so it is only a year
function normalizeDeathday(endDates) {
  return endDates.match(/\d{3,4}/)[0];
}

// Checks for date
function has_date(x) {
  return x.date;
}

// Gets artist name ready for fetching from wiki
function modifyNameForWiki(artist) {
  return artist.name.replace(/ /g, "_");
}

// get request to the api using the search bar (1st request)
app.get("/search", (req, res) => {
  search(req.query.search)
    // .then(logStep("search"))
    .then(getInfo)
    // .then(logStep("getInfo"))
    .then(({ type, info }) => {
      let ps;
      if (type === "artist") {
        let artistsArtwork = getArtistsArtwork(info).then(map_artworks);
        let similarArtists = getSimilarArtists(info).then(map_artists);

        ps = Promise.all([artistsArtwork, similarArtists, map_artists([info])])

          .then(flatten);
      } else if (type === "artwork") {
        ps = Promise.all([
          getSimilarArtworks(info).then(map_artworks),
          getArtworksArtist(info).then(map_artists),
          map_artworks(info)
        ]).then(([results, results2, results3]) => {
            return flatten([results, results2, results3]);
        });
      } else {
        throw new Error("unknown type: ", type);
      }

      return ps.then(similars => {
        similars.sort(function(a, b) {
          if (a.id < b.id) {
            return -1;
          } else if (a.id == b.id) {
            return 0;
          } else {
            return 1;
          }
        });
        if (req.query.format === "json") {
          res.json({ info, similars });
        } else {
          console.log("similars", similars)
          res.render("timeline", { info, similars });
        }
      });
    })
    .catch(err => {
      console.log("This is an error");
      console.log(err);
      res.send(
        "Error, please enter a valid artist or artwork. Return to <a href='/'>Search.</a>"
      );
    });
});

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.static("public"));

app.get("/test/:query", function(req, res) {
  wikipedia.getData(
    "http://en.wikipedia.org/wiki/" + req.params.query,
    function(wikiData) {
      res.send(wikiData);
    }
  );
});

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
