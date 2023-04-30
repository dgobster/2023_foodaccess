//declare global variables
var map;
var sidebar;

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

function createSidebar() {
    //create sidebar control and add to map
    var sidebar = L.control.sidebar('sidebar', {
        closeButton: true,
        position: 'right'
        //see source code if autopan isn't recognized
        //autoPan: true
    });
    map.addControl(sidebar);

    //add if want sidebar visible on startup
    /*setTimeout(function () {
      sidebar.show();
     }, 500); */

    //once sidebar functional, revise marker code to apply to data points on map 
    /*var marker = L.marker([51.2, 7]).addTo(map).on('click', function () {
        sidebar.toggle();
    });*/

    //sidebar visibility controls
    map.on('click', function () {
        sidebar.hide();
    })

    //sidebar will be visible
    sidebar.on('show', function () {
    });
    //sidebar is visible
    sidebar.on('shown', function () {
    });
    //sidebar will be hidden
    sidebar.on('hide', function () {
    });
    //sidebar is hidden
    sidebar.on('hidden', function () {
    });
    //sidebar close on click
    L.DomEvent.on(sidebar.getCloseButton(), 'click', function () {
    });

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
            L.geoJson(json).addTo(map)
        })
};

document.addEventListener('DOMContentLoaded', createMap)