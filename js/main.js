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
        zoom: 10
    });

    //add OSM base tilelayer
    L.tileLayer('https://api.mapbox.com/styles/v1/ntnawshin/clgvju9mb00eo01pad09z1f5v/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibnRuYXdzaGluIiwiYSI6ImNsYThjZzB4MjAyZXY0MHBlcHNrZHd6YmUifQ.wrjSJbaNvwf48Hu-xk2vNg',
        {
            maxZoom: 20,
            opacity: .65,
        }
    ).addTo(map);

    //call getData function
    getData();
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
            '<b>' + 'Address:' + '</b><br/><a href=' + props.Location_Directions +' target="_blank">' + props.Location_Address + '</a><br/>' +
            '<b>' + 'Email Address:' + '</b><br/>' + props.Email + '<br/>' +
            '<b>' + 'Phone Number:' + '</b><br/>' + props.Phone + '<br/>' +
            '<b>' + 'Website:' + '</b><br/>' + (props.Website === 'Information unavailable' || props.Website === 'In Location Services, if listed' ? props.Website : '<a href=' + props.Website + ' target="_blank">' + props.Website + '</a>') + '<br/>' +
            '<b>' + 'Listing Updated:' + '</b><br/>' + props.Updated + '<br/>'


            : 'Click on Location');
    };

    info.addTo(map);
};

//PopupContent constructor function
function PopupContent(properties, attribute) {
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.split("rate")[1];
    this.population = this.properties[attribute];
    this.formatted = "<p><b>County:</b> " + this.properties.County + "</p><p><b>Food Share Population Rate in 20" + this.year + ":</b> " + this.population + " %</p>";
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
    return d > 1000 ? '#800026' :
        d > 500 ? '#BD0026' :
            d > 200 ? '#E31A1C' :
                d > 100 ? '#FC4E2A' :
                    d > 50 ? '#FD8D3C' :
                        d > 20 ? '#FEB24C' :
                            d > 10 ? '#FED976' :
                                '#FFEDA0';
}
//create legend with provider types, update to appropriate
function createLegend() {
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 10, 20, 50, 100, 200, 500, 1000],
            labels = [];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);
}

// find the common markers between the current layer and the newly selected layer
function intersectLayers(currentLayer, newLayer) {
    var commonMarkers = [];

    newLayer.eachLayer(function (layer1Obj) {
        var layer1OrgName = layer1Obj.feature.properties["Organization_Name"];
        var layer1Coords = layer1Obj.feature.geometry.coordinates;

        currentLayer.eachLayer(function (layer2Obj) {
            var layer2OrgName = layer2Obj.feature.properties["Organization_Name"];
            var layer2Coords = layer2Obj.feature.geometry.coordinates;

            //match the coordinates and the organization name
            if (layer1Coords[0] == layer2Coords[0] && layer1Coords[1] == layer2Coords[1] && layer1OrgName === layer2OrgName) {
                commonMarkers.push(layer1Obj.toGeoJSON());
            }
        });

    });
    //ADD STYLE HERE ONLY
    //pointtolayer HERE; also move highlight code here potentially

    return L.geoJSON(commonMarkers, {
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
};

//chosses the layers based on the selected filters
function applyFilters(checkedValues) {
    currentLayer = filterLayers['all'];

    for (var i = 0; i < checkedValues.length; i++) {
        var value = checkedValues[i]
        switch (value) {
            case 'accepts_snap':
                currentLayer = intersectLayers(currentLayer, filterLayers['accepts_snap']);
                break;

            case 'accepts_wic':
                currentLayer = intersectLayers(currentLayer, filterLayers['accepts_wic']);
                break;

            case 'community_meals':
                currentLayer = intersectLayers(currentLayer, filterLayers['community_meals']);
                break;

            case 'delivery_available':
                currentLayer = intersectLayers(currentLayer, filterLayers['delivery_available']);
                break;

            case 'emergency_food_needs':
                currentLayer = intersectLayers(currentLayer, filterLayers['emergency_food_needs']);
                break;

            case 'farms_producers_markets':
                currentLayer = intersectLayers(currentLayer, filterLayers['farms_producers_markets']);
                break;

            case 'food_bank_pantry':
                currentLayer = intersectLayers(currentLayer, filterLayers['food_bank_pantry']);
                break;

            case 'business_org':
                currentLayer = intersectLayers(currentLayer, filterLayers['business_org']);
                break;

            case 'restaurant_bakery':
                currentLayer = intersectLayers(currentLayer, filterLayers['restaurant_bakery']);
                break;

            case 'retail':
                currentLayer = intersectLayers(currentLayer, filterLayers['retail']);
                break;

            case 'schools_childcare':
                currentLayer = intersectLayers(currentLayer, filterLayers['schools_childcare']);
                break;

            case 'shelters':
                currentLayer = intersectLayers(currentLayer, filterLayers['shelters']);
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
            info.update();
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
                applyFilters(checkedValues)
            else
                currentLayer = filterLayers['all'].addTo(map);
        });
    }
};

//creates the filters under the provider menu
function filterProviderData(json, value) {
    var markers = L.geoJson(json, {
        filter: providerFilter,
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
        filter: serviceFilter,
        onEachFeature: function (feature, layer) {
            /* layer.on({
                 click:function(e){
                     console.log("filter service layer function")
                     var lat = e.target._latlng.lat,
                         lon =e.target._latlng.lon;
                     map.flyTo(e.target._latlng,14)
                     info.update(layer.feature.properties)
                 }
             })*/
        }

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
    filterLayers['all'] = L.geoJson(json, {
        onEachFeature: function (feature, layer) {
            layer.on({
                click: function (e) {
                    console.log("create layer function")
                    var lat = e.target._latlng.lat,
                        lon = e.target._latlng.lon;
                    map.flyTo(e.target._latlng, 14)
                    info.update(layer.feature.properties)
                }
            })
        }
    });

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
            currentLayer = filterLayers['all'].addTo(map);
            createFilterUI();
        })
};

document.addEventListener('DOMContentLoaded', createMap)