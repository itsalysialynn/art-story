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

  return new Promise ((resolve, reject) => {
  const details_link = results._embedded.results[0]._links.self.href.substring(api_path.length + 1);

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
        resolve({type: newApi, info: filtered_results});
      }
    });
  });
}




// accessing the artist's artworks using the artist id
function getArtistsArtwork(results) {

  return new Promise ((resolve, reject) => {
    const artist_id = results.id;

  //handles artist specific searches
    api
      .newRequest()
      .follow('artworks')
      .withTemplateParameters({artist_id: artist_id})
      .withRequestOptions({
        headers: {
          "X-Xapp-Token": xappToken,
         Accept: "application/vnd.artsy-v2+json"
        }
      })

    .getResource((error, artists_artworks)=> {
      const artistsArtworks = artists_artworks._embedded.artworks;
      // console.log(artists_artworks._embedded.artworks);

      if(error) {
        reject(error);
      } else {
        resolve(artistsArtworks);
      }
    });
  });
}


// accessing similar artists with the artist id
function getSimilarArtists(results) {

  return new Promise ((resolve, reject) => {
  const artist_id = results.id;

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
        resolve(similarArtists);

      }
    });
  });
}

// accessing similar artworks with the artwork id
function getSimilarArtworks(results) {
  // console.log('getSimilarArtwork result:', results);
  return new Promise ((resolve, reject) => {
  const artwork_id = results.id
  console.log("artwork_id", artwork_id);
  // const artist_id = results._links.similar_artists.href.substring(api_path.length + 30)

  //handles artist specific searches
    api
      .newRequest()
      .follow('artworks')
      .withTemplateParameters({similar_to_artwork_id: artwork_id})
      .withRequestOptions({
        headers: {
          "X-Xapp-Token": xappToken,
         Accept: "application/vnd.artsy-v2+json"
        }
      })

    .getResource((error, similar_artworks)=> {
      const similarArtworks = similar_artworks._embedded.artworks;

      if(error) {
        reject(error);
      } else {
        resolve(similarArtworks);

      }
    });
  });
}

//get request to the api using the search bar (1st request)
app.get('/search', (req, res) => {
  search(req.query.search)
    .then((results) => {
      return getInfo(results)

    }).then(({type, info}) => {
      let ps;
      console.log(type, info)

      if (type === "artist"){
        ps = Promise.all([
          getArtistsArtwork(info).then(map_artworks),
          getSimilarArtists(info).then(map_artists),
          map_artists(info),

        ])
        .then(([results, results2, results3]) => {
          return flatten([results, results2, results3])
        })

      } else if (type === "artwork"){

        ps = Promise.all([
          getSimilarArtworks(info).then(map_artworks),
          map_artworks(info)
          ])
        .then(([results, results2]) => {
          return flatten([results, results2])
        })

      } else {
        throw new Error('unknown type: ', type)
      }


      return ps.then((similars)=> {
        similars.sort(function (a, b) {
          if (a.id < b.id) {
            return -1;
          } else if (a.id == b.id) {
            return 0;
          } else {
            return 1;
          }
        });
        console.log('similars:', JSON.stringify(similars, null, 2));
        res.render('results', {info, similars: similars})
      })

    })
    .catch((err) =>{
      console.log(err);
    });
});

function flatten(arr) {

  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

function has_birthday(x){
  if (!x.birthday){
    return false;
  } else if (x.birthday){
    return true;
  }
}

function map_artists(artists){
  if (!Array.isArray(artists)){
    artists = [artists];
  }
 return artists.filter(has_birthday).map(function(x){
  return   {id: x.id, content: x.name, start: x.birthday.match(/\d+/)[0], thumbnail: x._links.thumbnail.href}
 })
}

function has_date(x){
  if (!x.date){
    return false;
  } else if (x.date){
    return true;
  }
}

function map_artworks(artworks){
  if (!Array.isArray(artworks)){
    artworks = [artworks];
  }

 return artworks.filter(has_date).map(function(x){
  return   {id: x.id, content: x.title, start: x.date.match(/\d+/)[0], medium: x.medium, thumbnail: x._links.thumbnail.href}
 })
}





app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.static('public'));

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
