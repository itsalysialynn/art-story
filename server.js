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

const api_path = "https://api.artsy.net/api";

traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter);
const api = traverson.from(api_path).jsonHal();

// For debugging
function logStep(label) {
  return function logIt(data) {
    return data;
  };
}
// Promise.map polyfill
Promise.map = (arr, callback) => Promise.all(arr.map(callback));

function artsyAPI(endpoint, params) {
  return new Promise((resolve, reject) => {
    api
      .newRequest()
      .follow(endpoint)
      .withRequestOptions({
        headers: {
          "X-Xapp-Token": xappToken,
          Accept: "application/vnd.artsy-v2+json"
        }
      })
      .withTemplateParameters(params)
      .getResource((error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
  });
}
// Function for initial search
function search(searchQuery) {
  return artsyAPI("search", { q: searchQuery });
}

// Function to get info about search query
function getInfo(results) {
  let details_link, endpoint, id;
  try {
    //determines what the search term is (artist, gene, art work etc.)
    details_link = results._embedded.results[0]._links.self.href.substring(
      api_path.length + 1
    );
    endpoint = details_link.split("/")[0];
    endpoint = endpoint.substring(0, endpoint.length - 1);
    id = details_link.split("/")[1];
  } catch (e) {
    return Promise.reject(e);
  }
  return artsyAPI(endpoint, { id }).then(filtered_results => {
    return { type: endpoint, info: filtered_results };
  });
}

// Accesses the artist's artworks using the artist id
function getArtistsArtwork(results) {
  const artist_id = results.id;
  if (results.birthday === "") {
    return Promise.reject("Error, please enter a valid artist or artwork");
  }
  // handles artist specific searches
  return artsyAPI("artworks", { artist_id }).then(artists_artworks => {
    return artists_artworks._embedded.artworks;
  });
}

// gets an artworks artist using the artwork id
function getArtworksArtist(results) {
  const artwork_id = results.id;
  // handles artwork specific searches
  return artsyAPI("artists", { artwork_id }).then(artworks_artists => {
    return artworks_artist._embedded.artists;
  });
}

// Accesses similar artists with the artist id
function getSimilarArtists(results) {
  const artist_id = results.id;
  //handles artist specific searches
  return artsyAPI("artists", {
    similar_to_artist_id: artist_id
  }).then(similar_artists => {
    return similar_artists._embedded.artists;
  });
}

// Accesses similar artworks with the artwork id
function getSimilarArtworks(results) {
  const artwork_id = results.id;
  //handles artist specific searches
  return artsyAPI("artworks", {
    similar_to_artwork_id: artwork_id
  }).then(similar_artworks => {
    return similar_artworks._embedded.artworks;
  });
}

// Gets each artist ready for Vis
function map_artists(artists) {
  return (
    Promise.resolve(artists)
      .then(artists => artists.map(normalizeBirthday).filter(has_birthday))
      .then(updateArtistsFromWiki)
      .then(artists => artists.map(artistForVis))
      // .then(logStep("after filtering artists"))
      .catch(err => {
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
  return Promise.map(artworks.filter(has_date), artwork =>
    composeArtworkArtist(artwork)
  ).catch(err => {
    console.error("map_artworks failure");
    console.error(err);
    return [];
  });
}

function composeArtworkArtist(artwork) {
  const artwork_id = artwork.id;
  // handles artwork specific searches
  return artsyAPI("artists", {
    artwork_id: artwork_id
  }).then(artworks_artist => {
    const artworksArtist = artworks_artist._embedded.artists;
    const imageLink = artwork._links.image.href;
    const largeImage = imageLink.replace("{image_version}", "large");
    return {
      id: artwork.id,
      content: "&#9679" + artwork.title,
      start: artwork.date.match(/\d+/)[0],
      medium: artwork.medium,
      thumbnail: largeImage,
      group: "artwork",
      type: "point",
      artist: artworksArtist[0].name
    };
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
    let m = artist.birthday.match(/\d{3,4}/);
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
          // .then(logStep("process artist"))
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
          res.render("timeline", { info, similars });
        }
      });
    })
    .catch(err => {
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
