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


    var control = new L.Control({ position: 'topleft' });
    control.onAdd = function (map) {
        var azoom = L.DomUtil.create('a', 'resetzoom');
        azoom.innerHTML = "[Reset Zoom]";
        L.DomEvent
            .disableClickPropagation(azoom)
            .addListener(azoom, 'click', function () {
                map.setView(map.options.center, map.options.zoom);
            }, azoom);
        return azoom;
    };

    control.addTo(map);

    //add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/ntnawshin/clgvju9mb00eo01pad09z1f5v/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibnRuYXdzaGluIiwiYSI6ImNsYThjZzB4MjAyZXY0MHBlcHNrZHd6YmUifQ.wrjSJbaNvwf48Hu-xk2vNg',
        {
            maxZoom: 20,
            opacity: .65,
        }
    ).addTo(map);

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
            '<b>' + 'Listing Updated:' + '</b><br/>' + props.Updated + '<br/>'


            : 'Click on Location');
    };

    info.addTo(map);
};

//highlight point on mouseover; see if want highlight with point feature; move/delete styling
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    //bring layer to front
    layer.bringToFront();

    //update results panel with current marker info
    info.update(layer.feature.properties);

}
//reset highlight on mouseout; need to define geojson varibale before listeners and assign to layer; check w current code
function resetHighlight(e) {
    geojson.resetStyle(e.target);

    info.update();
}

//click listener zooms to point
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}
//listeners for highlight
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
//style later, change to provider layer
/*geojson = L.geoJson(json, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);
*/
function getColor(d) {
    return d == "Farms/producers/markets" ? '#4c9e9e' :
        d == "Food bank/pantry" ? '#e699c2' :
            d == "Organization/business" ? '#9463a8' :
                d == "Restaurant/bakery" ? '#f9f07d' :
                    d == "Retail" ? '#78bbdd' :
                        d == "School/childcare" ? '#f47f72':
                        '#FEB24C';
}
//create legend with provider types, update to appropriate
function createLegend() {
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = ["Farms/producers/markets", "Food bank/pantry", "Organization/business", "Restaurant/bakery", "Retail", "School/childcare"],
            labels = [];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i]) + '"></i> ' +
                grades[i] + (grades[i] ? '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);
}

function colorMarkers(layer) {
    var markers = [];
    var updatedLayer;

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
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#4c9e9e", color: "#387979", weight: 1, opacity: 1, fillOpacity: 0.8 });
                case "Food assistance site":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#e699c2", color: "#a86b8f", weight: 1, opacity: 1, fillOpacity: 0.8 });
                case "Business/Organization":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#9463a8", color: "#6b437d", weight: 1, opacity: 1, fillOpacity: 0.8 });
                case "Restaurant/Bakery":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#f9f07d", color: "#a29c5f", weight: 1, opacity: 1, fillOpacity: 0.8 });
                case "Retail":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#78bbdd", color: "#6186a0", weight: 1, opacity: 1, fillOpacity: 0.8 });
                case "School district nutrition program":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#f47f72", color: "#b55e55", weight: 1, opacity: 1, fillOpacity: 0.8 });
                case "Shelters":
                    return L.circleMarker(latlng, { radius: 8, fillColor: "#111111", color: "#000", weight: 1, opacity: 1, fillOpacity: 0.8 });
            }
        },

        onEachFeature: function (feature, layer) {
            layer.on({
                click: function (e) {
                    console.log("filter provider layer function")
                    var lat = e.target._latlng.lat,
                        lon = e.target._latlng.lon;
                    map.flyTo(e.target._latlng, 14)
                    info.update(layer.feature.properties)
                }
            })
        }

    });

    return updatedLayer;
}

// find the common markers between the current layer and the newly selected layer
function intersectLayers(serviceLayer, providerLayer) {
    var commonMarkers = [];

    serviceLayer.eachLayer(function (layer1Obj) {
        var layer1OrgName = layer1Obj.feature.properties["Organization_Name"];
        var layer1Coords = layer1Obj.feature.geometry.coordinates;

        providerLayer.eachLayer(function (layer2Obj) {
            var layer2OrgName = layer2Obj.feature.properties["Organization_Name"];
            var layer2Coords = layer2Obj.feature.geometry.coordinates;

            //match the coordinates and the organization name
            if (layer1Coords[0] == layer2Coords[0] && layer1Coords[1] == layer2Coords[1] && layer1OrgName === layer2OrgName) {
                console.log("Common");
                commonMarkers.push(layer1Obj.toGeoJSON());
            }
        });

    });
    //ADD STYLE HERE ONLY
    //pointtolayer HERE; also move highlight code here potentially

    return L.geoJSON(commonMarkers);
};

function uniteLayers(currentLayer, newLayer) {
    var commonMarkers = [];

    // take all the object from the current layer
    currentLayer.eachLayer(function (layer1Obj) {
        commonMarkers.push(layer1Obj.toGeoJSON());
    });

    //take only the new objects from the newLayer
    newLayer.eachLayer(function (layer1Obj) {
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

//chosses the layers based on the selected filters
function applyFilters(checkedValues) {
    var serviceLayer;
    var providerLayer;

    var serviceChecked = false;
    for (var i = 0; i < checkedValues.length; i++) {
        var value = checkedValues[i];

        switch (value) {
            case 'accepts_snap':
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['accepts_snap'];
                    serviceChecked = true;
                    console.log("")
                }
                else {
                    serviceLayer = uniteLayers(serviceLayer, filterLayers['accepts_snap'])
                }
                break;

            case 'accepts_wic':
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['accepts_wic'];
                    serviceChecked = true;
                }
                else {
                    serviceLayer = uniteLayers(serviceLayer, filterLayers['accepts_wic'])
                }
                break;

            case 'community_meals':
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['community_meals'];
                    serviceChecked = true;
                }
                else {
                    serviceLayer = uniteLayers(serviceLayer, filterLayers['community_meals'])
                }
                break;

            case 'delivery_available':
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['delivery_available'];
                    serviceChecked = true;
                }
                else {
                    serviceLayer = uniteLayers(serviceLayer, filterLayers['delivery_available'])
                }
                break;

            case 'emergency_food_needs':
                if (serviceChecked == false) {
                    serviceLayer = filterLayers['emergency_food_needs'];
                    serviceChecked = true;
                }
                else {
                    serviceLayer = uniteLayers(serviceLayer, filterLayers['emergency_food_needs'])
                }
                break;
        }
    }

    var providerChecked = false;
    for (var i = 0; i < checkedValues.length; i++) {
        var value = checkedValues[i];

        switch (value) {
            case 'farms_producers_markets':
                if (providerChecked == false) {
                    providerLayer = filterLayers['farms_producers_markets'];
                    providerChecked = true;
                }
                else {
                    providerLayer = uniteLayers(providerLayer, filterLayers['farms_producers_markets'])
                }
                break;

            case 'food_bank_pantry':
                if (providerChecked == false) {
                    providerLayer = filterLayers['food_bank_pantry'];
                    providerChecked = true;
                }
                else {
                    providerLayer = uniteLayers(providerLayer, filterLayers['food_bank_pantry'])
                }
                break;

            case 'business_org':
                if (providerChecked == false) {
                    providerLayer = filterLayers['business_org'];
                    providerChecked = true;
                }
                else {
                    providerLayer = uniteLayers(providerLayer, filterLayers['business_org'])
                }
                break;

            case 'restaurant_bakery':
                if (providerChecked == false) {
                    providerLayer = filterLayers['restaurant_bakery'];
                    providerChecked = true;
                }
                else {
                    providerLayer = uniteLayers(providerLayer, filterLayers['restaurant_bakery'])
                }
                break;

            case 'retail':
                if (providerChecked == false) {
                    providerLayer = filterLayers['retail'];
                    providerChecked = true;
                }
                else {
                    providerLayer = uniteLayers(providerLayer, filterLayers['retail'])
                }
                break;

            case 'schools_childcare':
                if (providerChecked == false) {
                    providerLayer = filterLayers['schools_childcare'];
                    providerChecked = true;
                }
                else {
                    providerLayer = uniteLayers(providerLayer, filterLayers['schools_childcare'])
                }
                break;

            case 'shelters':
                if (providerChecked == false) {
                    providerLayer = filterLayers['shelters'];
                    providerChecked = true;
                }
                else {
                    providerLayer = uniteLayers(providerLayer, filterLayers['shelters'])
                }
                break;
        }

    }


    if (typeof serviceLayer == 'undefined' && typeof providerLayer == 'undefined') {
        return;
    }
    else if (typeof serviceLayer != 'undefined' && typeof providerLayer == 'undefined' && providerChecked == false) {
        currentLayer = serviceLayer;
    }
    else if (typeof serviceLayer != 'undefined' && typeof providerLayer == 'undefined' && providerChecked == true) {
        return;
    }
    else if (typeof serviceLayer == 'undefined' && typeof providerLayer != 'undefined' && serviceChecked == false) {
        currentLayer = providerLayer;
    }
    else if (typeof serviceLayer == 'undefined' && typeof providerLayer != 'undefined' && serviceChecked == true) {
        return;
    }
    else {
        currentLayer = intersectLayers(serviceLayer, providerLayer);
    }

    currentLayer = colorMarkers(currentLayer);
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
                currentLayer = colorMarkers(filterLayers['all']).addTo(map);
        });
    }
};

//creates the filters under the provider menu
function filterProviderData(json, value) {
    var markers = L.geoJson(json, {
        filter: providerFilter
    });

    function providerFilter(feature) {
        if (Array.isArray(value)) {
            if (value.includes(feature.properties['Provider']))
                return true;
        }
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
        if (value === "snap") {
            if ((feature.properties['Source'] === "USDA SNAP") || (feature.properties['Location_Services'].toLowerCase().includes(" snap")))
                return true;
        }
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
            currentLayer = colorMarkers(filterLayers['all']).addTo(map);
            //old
            //currentLayer = filterLayers['all'].addTo(map);
        })
};

document.addEventListener('DOMContentLoaded', createMap)