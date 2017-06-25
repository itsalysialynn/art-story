// create a data set with groups
  var groupNames = ['artwork','artist','movement'];
  var groups = new vis.DataSet();
  for (var g = 0; g < groupNames.length; g++) {
    groups.add({id: g, content: groupNames[g]});
  }
  // DOM element where the Timeline will be attached
  var container = document.getElementById('visualization');

  // Create a DataSet (allows two way data-binding)
  var data = <%- JSON.stringify(similars, null, 2) %>;
  var info = <%- JSON.stringify(info)%>;
  var movements = <%- include partials/_art-movements.ejs %>;

  function flatten(arr) {
    return arr.reduce(function(flat, toFlatten) {
      return flat.concat(
        Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
      );
    }, []);
  }
  var full_data = flatten([data, movements])
  for (var thing_id in full_data) {
  full_data[thing_id].group = groupNames.indexOf(full_data[thing_id].group);
  }
  var all_data = new vis.DataSet (full_data);
  console.log("yitems", all_data);
  // console.log("full data", full_data)
  var start =   +info.birthday || +info.date;
  // Configuration for the Timeline
  var options = {
  maxHeight: '500px',
  minHeight: '499px',
  width: '100%',
  verticalScroll: false,
  // zoomable: false,
  zoomMin: 31556952000,
  min: new Date(-4000, 0, 1),
  max: new Date(),
  start: new Date(start, 0, 1),
  end: new Date(2017, 0, 1),
  format: {
  minorLabels: function(date, scale, step) {
  let year = date.year();
  let output = '';
  switch (scale) {
  case 'year':
  output = Math.abs(date.format('YYYY'));
  output += (year < 0) ? 'BC' : '';
  break;
  }
  return output;
  }
  },
  dataAttributes: ["id", "content", "thumbnail", "medium", "group"]
  };
  // Create a Timeline
  var timeline = new vis.Timeline(container, all_data, groups, options);
  // timeline.setGroups(groups);
  timeline.on('select', function (properties) {
  var selected = $(properties.event.firstTarget).parents('[data-id]')[0];
  console.log('item selected:', selected.dataset.id);
  var selectedId = selected.dataset.id;
  var thumbnailUrl = selected.dataset.thumbnail;
  var mediumArtwork = selected.dataset.medium;
  var nameTitle = selected.dataset.content;
  if (selectedId !== undefined){
  console.log("thumbnailUrl", thumbnailUrl, "medium", mediumArtwork)
  document.getElementById('thumbnail').innerHTML = "<img src='" + thumbnailUrl + "'> ";
  if(mediumArtwork){
  document.getElementById('medium').innerHTML = "<div>" + mediumArtwork + "</div> "
  } else (
  document.getElementById('medium').innerHTML = "<div></div> "
  )
  var modfiedName = nameTitle.replace(/\s/g, "+")

  if (mediumArtwork){
  document.getElementById('name').innerHTML = "<div>" + nameTitle + "</div>"
  } else {
  document.getElementById('name').innerHTML = "<div><a href='/search?search=" + modfiedName + "'>" + nameTitle + "</a></div>"
  }

  function getById(datum){
  return datum.id === selectedId;
  }
  console.log("find", data.filter(getById))
  // console.log("find", data.filter(function(datum){return datum.id === selectedId;}))
  // console.log("find", data.filter(datum => datum.id === selectedId));
  let wikiQuery = $(selected).find('.vis-item-content').text().replace(/ /g, '_');
  console.log("http://en.wikipedia.org/wiki/"+ wikiQuery);
  console.log("group", properties.event.firstTarget.parentNode.dataset.group)
  try {
  WIKIPEDIA.getData('http://en.wikipedia.org/wiki/' + wikiQuery, function success(wikiData) {
  console.log("wikidata", wikiData);
  var artistSummary = wikiData.summary && wikiData.summary.summary
  console.log("artistSummary", artistSummary)
  if (selected.dataset.group === "1"){
  if (artistSummary){
  document.getElementById('summary').innerHTML = "<div>" + artistSummary + "</div> "
  var wikiLink = "http://en.wikipedia.org/wiki/"+ wikiQuery
  document.getElementById('wikiLink').innerHTML = "<a href='" + wikiLink + "' target='blank'>"+ "More Info" +"</a>"
  } else {
  document.getElementById('summary').innerHTML = "<div> Could not find summary at this time</div> "
  document.getElementById('wikiLink').innerHTML = "<a href='' target='blank'></a>"
  }
  } else {
  document.getElementById('summary').innerHTML = "<div> </div> "
  document.getElementById('wikiLink').innerHTML = "<a href='' target='blank'></a>"
  }
  }, function wikiError(err) {
  console.log('error:', err);
  });
  } catch (err) {
  console('error:', err);
  }
  }
  })