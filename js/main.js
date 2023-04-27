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
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        maxZoom: 20,
        opacity: .65,
        attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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