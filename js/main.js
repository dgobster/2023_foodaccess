//declare global variables
var map;
var sidebar;
var filterLayers = {};
var currentLayer;

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

function intersecLayers(currentLayer, newLayer) {
    var commonMarkers = [];

    newLayer.eachLayer(function (layer1Obj) {
        var matches = 0;
        var layer1Coords = layer1Obj.feature.geometry.coordinates;
        currentLayer.eachLayer(function (layer2Obj) {
            var layer2Coords = layer2Obj.feature.geometry.coordinates;
            if (layer1Coords[0] == layer2Coords[0] && layer1Coords[1] == layer2Coords[1]) {
                matches = matches + 1;
                /*
                if(matches > 1){
                    console.log(" ")
                    console.log(layer1Coords);
                    console.log(layer2Coords);
                    console.log(" ")
                }
                */
                console.log("True");
                commonMarkers.push(layer1Obj.toGeoJSON());
            }
        });
    });

    return L.geoJSON(commonMarkers);
}

//chosses the layers based on the selected filters
function applyFilters(checkedValues) {
    currentLayer = filterLayers['all'];

    for (var i = 0; i < checkedValues.length; i++) {
        var value = checkedValues[i]
        console.log(value)
        switch (value) {
            case 'accepts_snap':
                currentLayer = intersecLayers(currentLayer, filterLayers['accepts_snap']);
                break;

            case 'accepts_wic':
                currentLayer = intersecLayers(currentLayer, filterLayers['accepts_wic']);
                break;

            case 'community_meals':
                currentLayer = intersecLayers(currentLayer, filterLayers['community_meals']);
                break;

            case 'delivery_available':
                currentLayer = intersecLayers(currentLayer, filterLayers['delivery_available']);
                break;

            case 'emergency_food_needs':
                currentLayer = intersecLayers(currentLayer, filterLayers['emergency_food_needs']);
                break;

            case 'farms_producers_markets':
                currentLayer = intersecLayers(currentLayer, filterLayers['farms_producers_markets']);
                break;

            case 'food_bank_pantry':
                currentLayer = intersecLayers(currentLayer, filterLayers['food_bank_pantry']);
                break;

            case 'business_org':
                currentLayer = intersecLayers(currentLayer, filterLayers['business_org']);
                break;

            case 'restaurant_bakery':
                currentLayer = intersecLayers(currentLayer, filterLayers['restaurant_bakery']);
                break;

            case 'retail':
                currentLayer = intersecLayers(currentLayer, filterLayers['retail']);
                break;

            case 'schools_childcare':
                currentLayer = intersecLayers(currentLayer, filterLayers['schools_childcare']);
                break;

            case 'shelters': //filterLayers['shelters'].addTo(map);
                break;
        }
    }
    currentLayer.addTo(map);
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
            map.removeLayer(currentLayer);

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
                currentLayer = filterLayers['all'].addTo(map);
            }
        });
    }

};

//creates the filters under the provider section
function filterProviderData(json, value) {
    console.log(value);
    var markers = L.geoJson(json, { filter: providerFilter });
    function providerFilter(feature) {
        if (Array.isArray(value)) {
            if (value.includes(feature.properties['Organization Type'])) {
                console.log("True");
                return true;
            }
        }
        else {
            if (feature.properties['Organization Type'] === value) {
                console.log("True");
                return true;
            }
        }
    }

    return markers;
}

//creates the filters under the service section
function filterServiceData(json, value) {
    console.log(value);
    var markers = L.geoJson(json, { filter: serviceFilter });
    function serviceFilter(feature) {
        if (value === "snap") {
            if ((feature.properties['Source'] === "USDA SNAP") || (feature.properties['Location_Services'].toLowerCase().includes(" snap"))) {
                console.log("True");
                return true;
            }
        }
        else {
            if (feature.properties['Location_Services'].toLowerCase().includes(value)) {
                console.log("True");
                return true;
            }
        }
    }

    return markers;
}

//creates all the layers based on the filters
function createLayers(json) {
    //layer containing all the markers
    filterLayers['all'] = L.geoJson(json);

    //layers for service filters
    filterLayers['accepts_snap'] = filterServiceData(json, "snap");
    filterLayers['accepts_wic'] = filterServiceData(json, " wic");
    filterLayers['community_meals'] = filterServiceData(json, "community meal");
    filterLayers['delivery_available'] = filterServiceData(json, "delivery");
    filterLayers['emergency_food_needs'] = filterServiceData(json, "emergency");

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
            //create the different layers based on the filters
            createLayers(json)
            currentLayer = filterLayers['all'].addTo(map);
            console.log("Filter");
            createFilterUI();
        })
};

document.addEventListener('DOMContentLoaded', createMap)