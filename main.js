let chartView = [];

document.addEventListener("DOMContentLoaded", function () {
  fetch('https://raw.githubusercontent.com/thomasthomsen16/dataset-p2/refs/heads/main/30000_spotify_songs.csv')
    .then(response => response.text())
    .then(csvData => {
      const parsedData = parseCSV(csvData);
      const sampleData = getRandomSample(parsedData, 100);
      renderChart(sampleData, "chart1");
      fillTableWithRandomSongs(sampleData);
    })

  // Handle genre checkboxes dynamically
  const genres = ["edm", "latin", "pop", "rnb", "rap", "rock"];
  genres.forEach(genre => {
    document.getElementById(`${genre}Checkbox`).addEventListener("change", function () {
      if (chartView) {
        chartView.signal(genre, this.checked ? 1 : 0).runAsync();
      }
    }); 
  });

  document.getElementById("reveal-button").addEventListener("click", function () {
    highlightSelectedSongs();
      // Reveal the genre column header
  document.getElementById("genre-column-header").style.display = "table-cell";

  // Reveal each genre cell in the rows
  const genreCells = document.querySelectorAll("#genre-cell");
  genreCells.forEach(cell => {
    cell.style.display = "table-cell"; // Make genre cells visible
  });
  });

    // Dropdown change event to check if all are selected
    const dropdowns = [
      document.getElementById("row1Select"),
      document.getElementById("row2Select"),
      document.getElementById("row3Select"),
      document.getElementById("row4Select"),
    ];
  
    dropdowns.forEach(dropdown => dropdown.addEventListener("change", checkDropdowns));
});


function renderChart(sampleData, chartId) {
  const chartContainer = document.getElementById(chartId);
  chartContainer.innerHTML = ""; // Clear existing content

  const spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "description": "Parallel coordinates plot for Spotify songs with selectable axes via dropdowns.",
    "data": {
      "values": sampleData
    },
    "width": 800,
    "height": 500,
    "params": [
      {
        "name": "axis1",
        "value": "tempo",
      },
      {
        "name": "axis2",
        "value": "danceability",
      },
      {
        "name": "axis3",
        "value": "energy",
      },
      {
        "name": "axis4",
        "value": "valence",
      },
      {
        name: "edm",
        value: 1,
      },
      {
        name: "latin",
        value: 1,
      },
      {
        name: "pop",
        value: 1,
      },
      {
        name: "rnb",
        value: 1,
      },
      {
        name: "rap",
        value: 1,
      },
      {
        name: "rock",
        value: 1,
      },
      {
        "name": "highlightedSongs",
        "value": []
      }
    ],
    "transform": [
      {
        "calculate": "year(datetime(datum.track_album_release_date))",
        "as": "release_year"
      },
      {
        "filter": "datum[axis1] != null && datum[axis2] != null && datum[axis3] != null && datum[axis4] != null"
      },
      {
        "window": [{ "op": "count", "as": "index" }]
      },
      {
        "fold": ["tempo", "danceability", "energy", "valence", "speechiness", "instrumentalness", "duration_ms", "liveness", "release_year"],
        "as": ["key", "value"]
      },
      {
        "filter": "datum.key === axis1 || datum.key === axis2 || datum.key === axis3 || datum.key === axis4"
      },
      {
        "joinaggregate": [
          { "op": "min", "field": "value", "as": "min" },
          { "op": "max", "field": "value", "as": "max" }
        ],
        "groupby": ["key"]
      },
      {
        "calculate": "datum.max === datum.min ? 0 : (datum.value - datum.min) / (datum.max - datum.min)",
        "as": "norm_val"
      },
      {
        "calculate": "(datum.min + datum.max) / 2",
        "as": "mid"
      },
    ],
    "layer": [
      {
        "mark": { "type": "rule", "color": "#ccc" },
        "encoding": {
          "detail": { "aggregate": "count" },
          "x": {
            "type": "nominal",
            "field": "key",
            "sort": [
              { "signal": "axis1" },
              { "signal": "axis2" },
              { "signal": "axis3" },
              { "signal": "axis4" }
            ]
          }
        }
      },
      {
        "mark": "line",
        "encoding": {
          "color": {
            "condition": {
              "test": "indexof(highlightedSongs, datum.index) > -1",
              "value": "black"
            },
            "field": "playlist_genre",
            "type": "nominal"
          },
          "detail": { "type": "nominal", "field": "index" },
          "opacity": {
            "condition": {
              "test": {
                "or": [
                  { "and": ["datum.playlist_genre == 'edm'", "edm"] },
                  { "and": ["datum.playlist_genre == 'latin'", "latin"] },
                  { "and": ["datum.playlist_genre == 'pop'", "pop"] },
                  { "and": ["datum.playlist_genre == 'r&b'", "rnb"] },
                  { "and": ["datum.playlist_genre == 'rap'", "rap"] },
                  { "and": ["datum.playlist_genre == 'rock'", "rock"] }
                ]
              },
              "value": 1
            },
            "value": 0
          },
          "x": {
            "type": "nominal",
            "field": "key",
            "sort": [
              { "signal": "axis1" },
              { "signal": "axis2" },
              { "signal": "axis3" },
              { "signal": "axis4" }
            ]
          },
          "y": {
            "type": "quantitative",
            "field": "norm_val",
            "axis": null
          },
          "tooltip": [
            { "type": "quantitative", "field": "tempo" },
            { "type": "quantitative", "field": "danceability" },
            { "type": "quantitative", "field": "energy" },
            { "type": "quantitative", "field": "valence" }
          ]
        }
      },
      {
        "encoding": {
          "x": {
            "type": "nominal",
            "field": "key",
            "sort": [
              { "signal": "axis1" },
              { "signal": "axis2" },
              { "signal": "axis3" },
              { "signal": "axis4" }
            ]
          },
          "y": { "value": 0 }
        },
        "layer": [
          {
            "mark": { "type": "text", "style": "label" },
            "encoding": {
              "text": { "aggregate": "max", "field": "max" }
            }
          },
          {
            "mark": { "type": "tick", "style": "tick", "size": 8, "color": "#ccc" }
          }
        ]
      },
      {
        "encoding": {
          "x": {
            "type": "nominal",
            "field": "key",
            "sort": [
              { "signal": "axis1" },
              { "signal": "axis2" },
              { "signal": "axis3" },
              { "signal": "axis4" }
            ]
          },
          "y": { "value": 150 }
        },
        "layer": [
          {
            "mark": { "type": "text", "style": "label" },
            "encoding": {
              "text": { "aggregate": "min", "field": "mid" }
            }
          },
          {
            "mark": { "type": "tick", "style": "tick", "size": 8, "color": "#ccc" }
          }
        ]
      },
      {
        "encoding": {
          "x": {
            "type": "nominal",
            "field": "key",
            "sort": [
              { "signal": "axis1" },
              { "signal": "axis2" },
              { "signal": "axis3" },
              { "signal": "axis4" }
            ]
          },
          "y": { "value": 300 }
        },
        "layer": [
          {
            "mark": { "type": "text", "style": "label" },
            "encoding": {
              "text": { "aggregate": "min", "field": "min" }
            }
          },
          {
            "mark": { "type": "tick", "style": "tick", "size": 8, "color": "#ccc" }
          }
        ]
      }
    ],
    "config": {
      "axisX": { "domain": false, "labelAngle": 0, "tickColor": "#ccc", "title": null },
      "view": { "stroke": null },
      "style": {
        "label": { "baseline": "middle", "align": "right", "dx": -5 },
        "tick": { "orient": "horizontal" }
      }
    }
  };

  vegaEmbed(`#${chartId}`, spec).then(result => {
    chartView = result.view;
  }).catch(console.error);
}



// Function to parse CSV data into an array of objects
function parseCSV(csvData) {
  const rows = csvData.split("\n").filter(row => row.trim() !== "");
  const header = rows[0].split(",").map(column => column.trim());

  return rows.slice(1).map(row => {
    const values = row.split(",");

    if (values.length !== header.length) {
      return null;
    }

    let parsedRow = {};
    header.forEach((column, index) => {
      let value = values[index].trim();
      parsedRow[column] = isNaN(value) ? value : parseFloat(value);
    });

    return parsedRow;
  }).filter(row => row !== null);
}

function getRandomSample(data, sampleSize) {
  const requiredFields = ["tempo", "danceability", "energy", "valence", "speechiness", "instrumentalness", "duration_ms", "liveness", "release_year"];
  const validData = data.filter(row => requiredFields.every(field => row[field] !== null));

  // Group songs by playlist_genre
  const groupedByGenre = validData.reduce((acc, row) => {
    const genre = row.playlist_genre; // Updated to use playlist_genre
    if (!acc[genre]) acc[genre] = [];
    acc[genre].push(row);
    return acc;
  }, {});

  // Determine how many songs to take from each genre
  const genres = Object.keys(groupedByGenre);
  const genreSampleSize = Math.floor(sampleSize / genres.length);

  // Select a random sample from each genre
  const sampleFromEachGenre = genres.map(genre => {
    const genreSongs = groupedByGenre[genre];
    const selectedSongs = genreSongs
      .sort(() => 0.5 - Math.random()) // Randomize order
      .slice(0, genreSampleSize); // Take a random sample
    return selectedSongs;
  });

  // Flatten the array of samples
  const allSelectedSongs = sampleFromEachGenre.flat();

  // If we still need more songs due to rounding, fill up the remaining spots randomly
  if (allSelectedSongs.length < sampleSize) {
    const remainingSongs = validData
      .filter(song => !allSelectedSongs.includes(song)) // Exclude already selected songs
      .sort(() => 0.5 - Math.random())
      .slice(0, sampleSize - allSelectedSongs.length);
    allSelectedSongs.push(...remainingSongs);
  }

  // Shuffle the final list to avoid any bias
  return allSelectedSongs
    .sort(() => 0.5 - Math.random()) // Shuffle
    .map((row, i) => ({ ...row, index: i })); // Assign index
}

function fillTableWithRandomSongs(sampleData) {
  const randomSongs = sampleData.sort(() => Math.random() - 0.5).slice(0, 4);

  // Randomly shuffle and then pick 4 songs.
  for (let i = 0; i < randomSongs.length; i++) {
    const song = randomSongs[i];
    // Get the row by its ID ("row1", "row2", etc.)
    const row = document.getElementById("row" + (i + 1));

    if (row && row.cells.length >= 5) {
      // Fill in the first four cells with the song's values.
      row.cells[0].innerText = song.tempo;
      row.cells[1].innerText = song.danceability;
      row.cells[2].innerText = song.energy;
      row.cells[3].innerText = song.valence;
      row.cells[5].innerText = song.playlist_genre;

      // Assign the correct index from the dataset
      row.dataset.index = song.index;  // Ensure `index` exists in `song`
    }
  }
};


function highlightSelectedSongs() {
  let selectedIndexes = [];
  for (let i = 1; i <= 4; i++) {
    const row = document.getElementById("row" + i);
    if (row && row.dataset.index) {
      selectedIndexes.push(parseInt(row.dataset.index));
    }
  }
  if (chartView) {
    chartView.signal("highlightedSongs", selectedIndexes).runAsync();
  }
};

function checkDropdowns() {
  
  const allSelected = dropdowns.every(dropdown => dropdown.value !== "");
  revealButton.disabled = !allSelected; // Enable if all are selected, otherwise disable
};

function checkDropdowns() {
  const dropdowns = [
    document.getElementById("row1Select"),
    document.getElementById("row2Select"),
    document.getElementById("row3Select"),
    document.getElementById("row4Select"),
  ];

  const allSelected = dropdowns.every(dropdown => dropdown.value !== "");
  const revealButton = document.getElementById("reveal-button");
  revealButton.disabled = !allSelected;
}

function revealGenreColumn() {
  // Show the genre column header
  document.getElementById("genre-column-header").style.display = "table-cell";
  
  const genres = ["edm", "latin", "pop", "rnb", "rap", "rock"];

  // For each row, set the genre based on the song index
  const rows = document.querySelectorAll("tr[id^='row']");
  rows.forEach(row => {
    const songIndex = row.dataset.index;

    // Directly compute the genre for this song based on its index
    const genre = genres[songIndex % genres.length];

    // Check if the genre cell exists in the row and is initially hidden
    const genreCell = row.querySelector("td[id='hidden-cell']");
    if (genreCell) {
      genreCell.style.display = "table-cell"; // Make sure the genre cell is visible
      genreCell.innerText = genre; // Fill the genre cell (column 6)
    }
  });
}

