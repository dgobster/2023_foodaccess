//declare global variables
var map;
var filterLayers = {};
var currentLayer;
var info = L.control();


//function to instantiate the Leaflet map
function createMap() {
    //create the map
    map = L.map('map', {
        center: [43.0722, -89.4008],
        zoom: 10,
        zoomsliderControl: true,
        zoomControl: false
    });

    //add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/ntnawshin/clgvju9mb00eo01pad09z1f5v/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibnRuYXdzaGluIiwiYSI6ImNsYThjZzB4MjAyZXY0MHBlcHNrZHd6YmUifQ.wrjSJbaNvwf48Hu-xk2vNg',
        {
            maxZoom: 20,
            opacity: .65,
        }
    ).addTo(map);

    var control = new L.Control({ position: 'topleft' });
    control.onAdd = function (map) {
        var azoom = L.DomUtil.create('a', 'resetzoom');
        azoom.innerHTML = "Reset Zoom";
        L.DomEvent
            .disableClickPropagation(azoom)
            .addListener(azoom, 'click', function () {
                map.setView(map.options.center, map.options.zoom);
            }, azoom);
        return azoom;
    };

    control.addTo(map);

    //call getData function
    getData();
    createFilterUI();
    customControl();
    createLegend();
};

//create custom control for info panel
function customControl() {
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this._div.style.overflowY = 'auto'; // Enable vertical scrolling
        this.update();
        return this._div;
    };


    // method to update the control based on feature properties passed; alter to attributes for dataset from eg
    info.update = function (props) {
        this._div.innerHTML = '<h4>Location Information</h4>' + (props ?
            '<b>' + 'Location Name:' + '</b><br/>' + props.Organization_Name + '<br/>' +
            '<b>' + 'Address:' + '</b><br/><a href=' + props.Location_Directions + ' target="_blank">' + props.Location_Address + '</a><br/>' +
            '<b>' + 'Email Address:' + '</b><br/>' + props.Email + '<br/>' +
            '<b>' + 'Phone Number:' + '</b><br/>' + props.Phone + '<br/>' +
            '<b>' + 'Website:' + '</b><br/>' + (props.Website === 'Information unavailable' || props.Website === 'In Location Services, if listed' ? props.Website : '<a href=' + props.Website + ' target="_blank">' + props.Website + '</a>') + '<br/>' +
            '<b>' + 'Location Services:' + '</b><br/>' + props.Location_Services + '<br/>' +
            '<b>' + 'Listing Updated:' + '</b><br/>' + props.Updated + '<br/>'


            : 'Click on a point for more information');
    };
    //reset results panel to a default message when clicking off a point
    /*document.addEventListener('click', function (event) {
        var infoDiv = document.querySelector('.info');
        var pointElement = event.target.closest('.point');

        if (!pointElement) {
            infoDiv.innerHTML = '<h4>Location Information</h4>' + "Click on a point for more information- test";
        }
    });*/

    info.addTo(map);
};



function getColor(d) {
    return d == "Farms/producers/markets" ? '#4c9e9e' :
        d == "Food bank/pantry" ? '#e699c2' :
            d == "Organization/business" ? '#9463a8' :
                d == "Restaurant/bakery" ? '#f9f07d' :
                    d == "Retail" ? '#78bbdd' :
                        d == "School/childcare" ? '#f47f72' :
                            '#FEB24C';
}

//create legend with provider types
function createLegend() {
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend');
        var grades = ["Farms/producers/markets", "Food bank/pantry", "Organization/business", "Restaurant/bakery", "Retail", "School/childcare"];

        // loop through our prioviders and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i]) + '"></i> ' +
                grades[i] + (grades[i] ? '<br>' : '+');
        }
        return div;
    };

    legend.addTo(map);
}

function addMarkerProperties(layer) {
    var markers = [];
    var updatedLayer;
    var layer;

    layer.eachLayer(function (layer1Obj) {
        markers.push(layer1Obj.toGeoJSON());
    });

    updatedLayer = L.geoJSON(markers, {
        pointToLayer: function (feature, latlng) {
            var provider = feature.properties['Provider'];

            switch (provider) {
                case "Community Garden":
                case "Farm/Producer":
                case "Farmers' Market":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#4c9e9e", color: "#387979", weight: 1, opacity: 1, fillOpacity: 0.8 }).bindTooltip("Click for more info");
                case "Food assistance site":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#e699c2", color: "#a86b8f", weight: 1, opacity: 1, fillOpacity: 0.8 }).bindTooltip("Click for more info");
                case "Business/Organization":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#9463a8", color: "#6b437d", weight: 1, opacity: 1, fillOpacity: 0.8 }).bindTooltip("Click for more info");
                case "Restaurant/Bakery":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#f9f07d", color: "#a29c5f", weight: 1, opacity: 1, fillOpacity: 0.8 }).bindTooltip("Click for more info");
                case "Retail":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#78bbdd", color: "#6186a0", weight: 1, opacity: 1, fillOpacity: 0.8 }).bindTooltip("Click for more info");
                case "School district nutrition program":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#f47f72", color: "#b55e55", weight: 1, opacity: 1, fillOpacity: 0.8 }).bindTooltip("Click for more info");
                case "Shelters":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#111111", color: "#000", weight: 1, opacity: 1, fillOpacity: 0.8 }).bindTooltip("Click for more info");
            }
        },

        onEachFeature: function (feature, layer) {
            layer.on({
                click: function (e) {
                    var lat = e.target._latlng.lat,
                        lon = e.target._latlng.lon;
                    map.flyTo(e.target._latlng, 14, {
                        duration: 1,  // custom duration in seconds
                        easeLinearity: 0,  // custom easing factor (0: linear, 1: ease-in-out)
                    });
                    info.update(layer.feature.properties)
                }
            })
        }


    });

    return updatedLayer;
}

// find the common markers between the current layer and the newly selected layer
function intersectLayers(layer1, layer2) {
    var commonMarkers = [];

    layer1.eachLayer(function (layer1Obj) {
        var layer1OrgName = layer1Obj.feature.properties["Organization_Name"];
        var layer1Coords = layer1Obj.feature.geometry.coordinates;

        layer2.eachLayer(function (layer2Obj) {
            var layer2OrgName = layer2Obj.feature.properties["Organization_Name"];
            var layer2Coords = layer2Obj.feature.geometry.coordinates;

            //match the coordinates and the organization name
            if (layer1Coords[0] == layer2Coords[0] && layer1Coords[1] == layer2Coords[1] && layer1OrgName === layer2OrgName) {
                console.log("Common");
                commonMarkers.push(layer1Obj.toGeoJSON());
            }
        });

    });

    return L.geoJSON(commonMarkers);
};

function uniteLayers(layer1, layer2) {
    var commonMarkers = [];

    // take all the object from the current layer
    layer1.eachLayer(function (layer1Obj) {
        commonMarkers.push(layer1Obj.toGeoJSON());
    });

    //take only the new objects from the newLayer
    layer2.eachLayer(function (layer1Obj) {
        var obj = layer1Obj.toGeoJSON();
        var present = false;

        for (var i = 0; i < commonMarkers.length; i++) {
            if (commonMarkers[i] === obj) {
                present = true;
            }
        }

        if (present == false) {
            commonMarkers.push(obj);
        }
    });

    return L.geoJSON(commonMarkers);
};

//chooses the layers based on the selected filters
function applyFilters(checkedValues) {
    var serviceLayer;
    var providerLayer;

    // create a layer based on common markers among the service filters
    var serviceChecked = false;
    for (var i = 0; i < checkedValues.length; i++) {
        var value = checkedValues[i];

        switch (value) {
            case 'accepts_snap':
                // if this is the first service filter then take all the markers of the filter
                // else take only the common markers    
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['accepts_snap'];
                    serviceChecked = true;
                }
                else
                    serviceLayer = intersectLayers(serviceLayer, filterLayers['accepts_snap']);
                break;

            case 'accepts_wic':
                // if this is the first service filter then take all the markers of the filter
                // else take only the common markers  
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['accepts_wic'];
                    serviceChecked = true;
                }
                else
                    serviceLayer = intersectLayers(serviceLayer, filterLayers['accepts_wic']);
                break;

            case 'community_meals':
                // if this is the first service filter then take all the markers of the filter
                // else take only the common markers  
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['community_meals'];
                    serviceChecked = true;
                }
                else
                    serviceLayer = intersectLayers(serviceLayer, filterLayers['community_meals']);
                break;

            case 'delivery_available':
                // if this is the first service filter then take all the markers of the filter
                // else take only the common markers  
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['delivery_available'];
                    serviceChecked = true;
                }
                else
                    serviceLayer = intersectLayers(serviceLayer, filterLayers['delivery_available']);
                break;

            case 'emergency_food_needs':
                // if this is the first service filter then take all the markers of the filter
                // else take only the common markers  
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['emergency_food_needs'];
                    serviceChecked = true;
                }
                else
                    serviceLayer = intersectLayers(serviceLayer, filterLayers['emergency_food_needs']);
                break;
        }
    }

    // create a layer based on all markers among the provider filters
    var providerChecked = false;
    for (var i = 0; i < checkedValues.length; i++) {
        var value = checkedValues[i];

        switch (value) {
            case 'farms_producers_markets':
                // if this is the first provider filter then take all the markers of this filter
                // else take all the markers from all the provider filters check so far 
                if (providerChecked == false) {
                    providerLayer = filterLayers['farms_producers_markets'];
                    providerChecked = true;
                }
                else
                    providerLayer = uniteLayers(providerLayer, filterLayers['farms_producers_markets']);
                break;

            case 'food_bank_pantry':
                // if this is the first provider filter then take all the markers of this filter
                // else take all the markers from all the provider filters check so far 
                if (providerChecked == false) {
                    providerLayer = filterLayers['food_bank_pantry'];
                    providerChecked = true;
                }
                else
                    providerLayer = uniteLayers(providerLayer, filterLayers['food_bank_pantry']);
                break;

            case 'business_org':
                // if this is the first provider filter then take all the markers of this filter
                // else take all the markers from all the provider filters check so far 
                if (providerChecked == false) {
                    providerLayer = filterLayers['business_org'];
                    providerChecked = true;
                }
                else
                    providerLayer = uniteLayers(providerLayer, filterLayers['business_org']);
                break;

            case 'restaurant_bakery':
                // if this is the first provider filter then take all the markers of this filter
                // else take all the markers from all the provider filters check so far 
                if (providerChecked == false) {
                    providerLayer = filterLayers['restaurant_bakery'];
                    providerChecked = true;
                }
                else
                    providerLayer = uniteLayers(providerLayer, filterLayers['restaurant_bakery']);
                break;

            case 'retail':
                // if this is the first provider filter then take all the markers of this filter
                // else take all the markers from all the provider filters check so far 
                if (providerChecked == false) {
                    providerLayer = filterLayers['retail'];
                    providerChecked = true;
                }
                else
                    providerLayer = uniteLayers(providerLayer, filterLayers['retail']);
                break;

            case 'schools_childcare':
                // if this is the first provider filter then take all the markers of this filter
                // else take all the markers from all the provider filters check so far 
                if (providerChecked == false) {
                    providerLayer = filterLayers['schools_childcare'];
                    providerChecked = true;
                }
                else
                    providerLayer = uniteLayers(providerLayer, filterLayers['schools_childcare']);
                break;

            case 'shelters':
                // if this is the first provider filter then take all the markers of this filter
                // else take all the markers from all the provider filters check so far 
                if (providerChecked == false) {
                    providerLayer = filterLayers['shelters'];
                    providerChecked = true;
                }
                else
                    providerLayer = uniteLayers(providerLayer, filterLayers['shelters']);
                break;
        }

    }

    // if both the service layer and the provider layer are empty
    if (typeof serviceLayer == 'undefined' && typeof providerLayer == 'undefined') {
        return;
    }
    // if only provider layer is empty because no provider filter was selected then show the service layer markers
    else if (typeof serviceLayer != 'undefined' && typeof providerLayer == 'undefined' && providerChecked == false) {
        currentLayer = serviceLayer;
    }
    // if only provider layer is empty but provider filter(s) were selected then the common marker set will be empty
    else if (typeof serviceLayer != 'undefined' && typeof providerLayer == 'undefined' && providerChecked == true) {
        return;
    }
    // if only service layer is empty because on service filter was selected then show the provider layer markers
    else if (typeof serviceLayer == 'undefined' && typeof providerLayer != 'undefined' && serviceChecked == false) {
        currentLayer = providerLayer;
    }
    // if only service layer is empty but service filter(s) were selected then the common marker set will be empty 
    else if (typeof serviceLayer == 'undefined' && typeof providerLayer != 'undefined' && serviceChecked == true) {
        return;
    }
    // otherwise find the common markers between the two layers
    else {
        currentLayer = intersectLayers(serviceLayer, providerLayer);
    }

    currentLayer = addMarkerProperties(currentLayer);
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

    //Create dropdown functionality for the help menu
    var help_menu = document.getElementById('help');
    help_menu.getElementsByClassName('anchor')[0].onclick = function (evt) {
        if (help_menu.classList.contains('visible'))
            help_menu.classList.remove('visible');
        else
            help_menu.classList.add('visible');
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
                if (checkboxes[j].checked)
                    checkedValues.push(checkboxes[j].value);
            }

            //select filters based on the checked boxes and apply them
            if (checkedValues.length > 0)
                applyFilters(checkedValues);
            else
                currentLayer = addMarkerProperties(filterLayers['all']).addTo(map);
        });
    }
};

//creates the filters under the provider menu
function filterProviderData(json, value) {
    var markers = L.geoJson(json, {
        filter: providerFilter
    });

    function providerFilter(feature) {
        // if more than only value needs to be mathced
        if (Array.isArray(value)) {
            if (value.includes(feature.properties['Provider']))
                return true;
        }
        // if a single value needs to be matched
        else {
            if (feature.properties['Provider'] === value)
                return true;
        }
    }

    return markers;
}

//creates the filters under the service menu
function filterServiceData(json, value) {
    var markers = L.geoJson(json, {
        filter: serviceFilter
    });

    function serviceFilter(feature) {
        // for 'snap' both the source column and the location service column needs to be checked
        if (value === "snap") {
            if ((feature.properties['Source'] === "USDA SNAP") || (feature.properties['Location_Services'].toLowerCase().includes(" snap")))
                return true;
        }
        // for others services only the location services column needs checking
        else {
            if (feature.properties['Location_Services'].toLowerCase().includes(value))
                return true;
        }
    }

    return markers;
}
//HERE back up location for styling all provider layers at once, may not need
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
    filterLayers['shelters'] = filterProviderData(json, "Shelters");
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
            currentLayer = addMarkerProperties(filterLayers['all']).addTo(map);
        })
};

document.addEventListener('DOMContentLoaded', createMap)