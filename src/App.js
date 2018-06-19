import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl'
import './App.css';
import quartieri from './data/Milano_quartieri.js';
import unitaTrasporti from './data/Milano_TPL.js';
import unitaFarmacie from './data/Milano_farmacie.js';
import intensitaTrasporti from './data/Milano_Trasporti.js';
import intensitaFarmacie from './data/Milano_Salute.js';
import * as colorScale from 'd3-scale-chromatic';

mapboxgl.accessToken = 'pk.eyJ1IjoiZW5qYWxvdCIsImEiOiJjaWhtdmxhNTIwb25zdHBsejk0NGdhODJhIn0.2-F2hS_oTZenAWc0BMf_uw';

var dataField = 'Pharmacy';
var dataSource = 'UnitaFarmacie';
var unita = unitaFarmacie;
var intensita = 'intensitaFarmacie';
var intensitaSource = intensitaFarmacie;
/*
var dataField = 'TransportStop';
var dataSource = 'UnitaTrasporti';
var unita = unitaTrasporti;
var intensita = 'intensitaTrasporti';
var intensitaSource = intensitaTrasporti;
*/
class App extends Component {
    map;
/*
    constructor(props) {
	super(props);

	this.layers = document.getElementById('menu-ui');
    }
  */  
    componentDidMount() {
	this.createMap();
    };
/*
    addLayer(layer, name, zIndex) {
	layer
            .setZIndex(zIndex)
            .addTo(map);
	
	// Create a simple layer switcher that
	// toggles layers on and off.
	var link = document.createElement('a');
        link.href = '#';
        link.className = 'active';
        link.innerHTML = name;
	
	link.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
	    
            if (map.hasLayer(layer)) {
		map.removeLayer(layer);
		this.className = '';
            } else {
		map.addLayer(layer);
		this.className = 'active';
            }
	};

	this.layers.appendChild(link);
    }
  */  		
    createMap() {
	this.map = new mapboxgl.Map({
	    container: this.mapContainer,
	    style: 'mapbox://styles/mapbox/light-v9',
	    center: [9.191383, 45.464211],
	    zoom: 11
	});

	this.map.on('load', () => {
	    //set input data
	    quartieri.features = quartieri.features.map(d => {
                var id = d.properties.IDquartiere;

                d.properties[intensita] = intensitaSource
                    .filter(d => {
                        return d.IDquartiere === id;
                    })[0][dataField][4];
                return d;
            });
	    var values = quartieri.features.map(d => d.properties[intensita]);
	    var affluenza = unita.features.map(d => d.properties["Affluenza"]);
	    
            var L = 7;
            values = sample(values, L);

	    affluenza = sample(affluenza, L);     
            var seq = Array.apply(null, {length: L})
                .map(Function.call, Number)
                .map(n => n/L);
            var colors = seq.map(s => colorScale.interpolateReds(s));


	    var map = this.map;
	    map.addSource('Quartieri', {
		type: 'geojson',
		data: quartieri
	    });
	    var layers = map.getStyle().layers;
	    this.firstSymbolId;
	    for (var i = 0; i < layers.length; i++) {
		if (layers[i].type === 'symbol') {
		    this.firstSymbolId = layers[i].id;
		    break;
		}
	    };
		
	    map.addLayer({
		id: 'Quartieri',
		type: 'fill',
		paint: {'fill-opacity': 0},
		layout: {},
		source: 'Quartieri'
	    }, this.firstSymbolId);
	    /*
	    map.setPaintProperty(
		'Quartieri',
		'fill-color',
		{
		    'property': intensita,
		    'stops': values.map((d, i) => [values[i], colors[i]]),
		    'default': 'red'
		});
	    */
	    map.addLayer({
		id: 'Quartieri-line',
		type: 'line',
		paint: {'line-opacity': 0.7},
		source: 'Quartieri'
	    }, this.firstSymbolId);

	    map.addSource(dataSource, {
		type: 'geojson',
		data: unita
	    });

	    map.addLayer({
                id: dataSource,
                type: 'circle',
                paint: {'circle-radius': 5, 'circle-stroke-width': 1, 'circle-stroke-color': 'black'},
                layout: {},
                source: dataSource
            }, this.firstSymbolId);

	    map.setPaintProperty(
		dataSource,
		'circle-color',
		{
		    'property': "Affluenza",
		    'stops': affluenza.map((d, i) => [affluenza[i], colors[i]]),
		    'default': 'red' 
		});

	    // Create a popup, but don't add it to the map yet.
	    var popup = new mapboxgl.Popup({
		closeButton: false,
		closeOnClick: false
	    });

	    map.on('mouseenter', dataSource, function(e) {
		map.getCanvas().style.cursor = 'pointer';

		var coordinates = e.features[0].geometry.coordinates.slice();
		var description = "Farmacia \"" + e.features[0].properties.DESCRIZIONEFARMACIA + "\"<br/>Affluenza " + Math.floor(e.features[0].properties.Affluenza);
				
		// Populate the popup and set its coordinates
		// based on the feature found.
		popup.setLngLat(coordinates)
		    .setHTML(description)
		    .addTo(map);
	    });

	    map.on('mouseleave', dataSource, function() {
		map.getCanvas().style.cursor = '';
		popup.remove();
	    });

	});
    };

    render() {
	return (
		<div id='mapContainer'
	            ref={el => this.mapContainer = el}
	            style={{
		        height: '90vh',
		        width: '100vw'
	            }}
		/>
	);
    };
};

function sample(values, C) {
    var min = Math.min(...values),
	max = Math.max(...values);
    return [...Array(C).keys()]
	.map((d) => d * (max - min) / (C - 1.1)  + min);
};

export default App;

