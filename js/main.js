//declare global variables
var map;

//function to instantiate the Leaflet map
function createMap() {
    //create the map
    map = L.map('map', {
        center: [43.0722, -89.4008
        ],
        zoom: 10
    });

    //add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/ntnawshin/clgvju9mb00eo01pad09z1f5v/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibnRuYXdzaGluIiwiYSI6ImNsYThjZzB4MjAyZXY0MHBlcHNrZHd6YmUifQ.wrjSJbaNvwf48Hu-xk2vNg',
    {
        maxZoom: 20,
        opacity: .65,
        // attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    //call getData function
    getData(map);
};


//function to retrieve the data and place it on the map
function getData(map) {
    //load the data
    fetch("data/data_final.geojson")
        .then(function (response) {
            return response.json();
        })
        //create a Leaflet GeoJSON layer and add it to the map
        .then(function (json) {
            L.geoJson(json).addTo(map);
        })
};

document.addEventListener('DOMContentLoaded', createMap)