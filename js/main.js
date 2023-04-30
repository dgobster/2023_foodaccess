//declare global variables
var map;
var sidebar;
var filterLayers = {};

//function to instantiate the Leaflet map
function createMap() {
    //create the map
    map = L.map('map', {
        center: [43.0722, -89.4008],
        zoom: 10
    });

    //add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/ntnawshin/clgvju9mb00eo01pad09z1f5v/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibnRuYXdzaGluIiwiYSI6ImNsYThjZzB4MjAyZXY0MHBlcHNrZHd6YmUifQ.wrjSJbaNvwf48Hu-xk2vNg',
        {
            maxZoom: 20,
            opacity: .65,
            // attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    ).addTo(map);

    //call getData function
    getData();
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

function filterData(markers, json, map, value, type) {

    if (type === 'service') {
        markers = L.geoJson(json, { filter: serviceFilter }).addTo(map);
    }
    else {
        markers = L.geoJson(json, { filter: providerFilter }).addTo(map);
    }

    function serviceFilter(feature) {
        if (feature.properties['Source'].toLowerCase().includes(value) || feature.properties['Location_Services'].toLowerCase().includes(value)) return true
    }

    function providerFilter(feature) {
        if (value.constructor === Array) {
            if (feature.properties['Organization Type'] in value) {
                console.log(feature.properties['Organization Type'])
                return true
            }
        }
        else {
            if (feature.properties['Organization Type'] === value) {
                console.log(feature.properties['Organization Type'])
                return true
            }
        }
    }
};

function applyFilters(checkedValues) {
    for (var i = 0; i < checkedValues.length; i++) {
        var value  = checkedValues[i]

        switch (value) {
            case 'accepts_snap':
                break;

            case 'accepts_wic':
                break;

            case 'community_meals':
                break;

            case 'delivery_available':
                break;

            case 'emergency_food_needs':
                break;

            case 'farms_producers_markets': filterLayers['farms_producers_markets'].addTo(map);
                break;

            case 'food_bank_pantry': filterLayers['food_bank_pantry'].addTo(map);
                break;

            case 'business_org': filterLayers['business_org'].addTo(map);
                break;

            case 'restaurant_bakery': filterLayers['restaurant_bakery'].addTo(map);
                break;

            case 'retail': filterLayers['retail'].addTo(map);
                break;

            case 'schools_childcare': filterLayers['schools_childcare'].addTo(map);
                break;

            case 'shelters': //filterLayers['shelters'].addTo(map);
                break;
        }
        
    }
};

function createFilterUI() {
    //Create dropdown functionality for the services menu
    var checkList_services = document.getElementById('list_services');
    checkList_services.getElementsByClassName('anchor')[0].onclick = function (evt) {
        if (checkList_services.classList.contains('visible'))
            checkList_services.classList.remove('visible');
        else
            checkList_services.classList.add('visible');
    }

    //Create dropdown functionality for the providers menu
    var checkList_providers = document.getElementById('list_providers');
    checkList_providers.getElementsByClassName('anchor')[0].onclick = function (evt) {
        if (checkList_providers.classList.contains('visible'))
            checkList_providers.classList.remove('visible');
        else
            checkList_providers.classList.add('visible');
    }

    
    //Check which boxes are checked
    var checkboxes = document.querySelectorAll("input[type=checkbox]");
    for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener('change', function () {

            // remove all the layers
            for(layer in filterLayers){
                map.removeLayer(filterLayers[layer]);
            }

            // make an array of the checked boxes
            var checkedValues = [];
            for (var j = 0; j < checkboxes.length; j++) {
                if (checkboxes[j].checked) {
                    checkedValues.push(checkboxes[j].value);
                }
            }

            //select filters based on the checked boxes and apply them
            if (checkedValues.length > 0) {
                applyFilters(checkedValues)
            }
            else {
                filterLayers['all'].addTo(map);
            }
        });
    }

};

function filterProviderData(json, value) {
    var markers = L.geoJson(json, { filter: providerFilter })
    function providerFilter(feature) {
        if (Array.isArray(value)) {
            if (value.includes(feature.properties['Organization Type'])) {
                return true;
            }
        }
        else {
            if (feature.properties['Organization Type'] === value) {
                return true;
            }
        }
    }

    return markers
}

function createLayers(json) {
    //layers based on the different filters
    filterLayers['all'] = L.geoJson(json);

    //layers for provider filters
    filterLayers['farms_producers_markets'] = filterProviderData(json, ["Community Garden", "Farm/Producer", "Farmers' Market"]);
    filterLayers['food_bank_pantry'] = filterProviderData(json, "Food assistance site");
    filterLayers['business_org'] = filterProviderData(json, "Business/Organization");
    filterLayers['restaurant_bakery'] = filterProviderData(json, "Restaurant/Bakery");
    filterLayers['retail'] = filterProviderData(json, "Retail");
    filterLayers['schools_childcare'] = filterProviderData(json, "School district nutrition program");
}


//function to retrieve the data and place it on the map
function getData() {
    //load the data
    fetch("data/data_final.geojson")
        .then(function (response) {
            return response.json();
        })
        //create a Leaflet GeoJSON layer and add it to the map
        .then(function (json) {
            createLayers(json)
            filterLayers['all'].addTo(map);
            createFilterUI();
        })
};

document.addEventListener('DOMContentLoaded', createMap)