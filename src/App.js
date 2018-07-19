import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl'
import './App.css';
import Legend from './Legend';

import quartieriGeojson from './data/Milano_quartieri.js';

import trasportiGeojson from './data/Milano_TPL.js';
import farmacieGeojson from './data/Milano_farmacie.js';
import bibliotecheGeojson from './data/Milano_biblioteche.js';
import scuoleGeojson from './data/Milano_scuole.js';

const parameters = [
    {'id': 'UnitaFarmacie', 'label': 'Farmacie', 'geojson': farmacieGeojson, 'radius': 5, 'description': ['DESCRIZIONEFARMACIA', 'INDIRIZZO', 'DATAINIZIOVALIDITA', 'DESCRIZIONETIPOLOGIA', 'CODICETIPOLOGIA', 'Affluenza']},
    {'id': 'UnitaTrasporti', 'label': 'Trasporti', 'geojson': trasportiGeojson, 'radius': 3, 'description': ['route_id', 'stop_name', 'Affluenza']},
    {'id': 'UnitaBiblioteche', 'label': 'Biblioteche', 'geojson': bibliotecheGeojson, 'radius': 5, 'description': ['denominazioni.ufficiale', 'ente', 'indirizzo.via-piazza', 'tipologia-amministrativa', 'tipologia-funzionale', 'Affluenza']},
    {'id': 'UnitaScuole', 'label': 'Scuole', 'geojson': scuoleGeojson, 'radius': 5, 'capacity': 'ALUNNI', 'description': ['DENOMINAZIONESCUOLA', 'DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA', 'ORDINESCUOLA', 'Affluenza', 'ALUNNI', 'myRatio']}
];

//data preprocessing
parameters.forEach((p) => {
    if (p.capacity !== undefined) {
	if (p.geojson.features.filter((f) => isNaN(f.properties[p.capacity])).length === 0) {
	    p.geojson.features.forEach((f) => f.properties['myRatio'] = Math.floor(100*f.properties['Affluenza']/f.properties[p.capacity])/100)
	    return;
	} 	    
    } 
    p.geojson.features.forEach((f) => f.properties['myRatio'] = f.properties['Affluenza']);
});

const stops = (geojson, property) => {
    return [[0, 'blue'], [Math.max(...geojson.features.map((f) => f.properties[property])), 'red']];
};

const getLayer = (l) => {
    return {
        'id': l.id,
        'label': l.label,
        'geojson': l.geojson,
        'geojsonProperty': 'myRatio',
        'type': 'circle',
        'source': l.id,
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'circle-color': {
                property: 'myRatio',
                stops: stops(l.geojson, 'myRatio')
            },
            'circle-opacity': 1,
            'circle-radius': l.radius,
            'circle-stroke-width': 1
        },
	'description': l.description
    }
};

//data visualization
mapboxgl.accessToken = 'pk.eyJ1IjoiZW5qYWxvdCIsImEiOiJjaWhtdmxhNTIwb25zdHBsejk0NGdhODJhIn0.2-F2hS_oTZenAWc0BMf_uw';
class App extends Component {
    map;
    layers = parameters.map((p) => getLayer(p));

    constructor(props: Props) {
	super(props);
	this.state = {
	    active: this.layers[0]
	};
    };

    componentDidMount() {	
	this.createMap();
    };
    
    addLayer(layer, zIndex) {
	var map = this.map;

	// Add layer
	map.addSource(layer.id, {
            type: 'geojson',
            data: layer.geojson
        });
	map.addLayer(layer);

	// Add popup
        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });
        map.on('mouseenter', layer.id, function(e) {
            map.getCanvas().style.cursor = 'pointer';
            var coordinates = e.features[0].geometry.coordinates.slice();
            var description = layer.description.map((p) => p + ": " + e.features[0].properties[p]).join("<br>");
            popup.setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);
        });
        map.on('mouseleave', layer.id, function() {
            map.getCanvas().style.cursor = '';
            popup.remove();
        });
    };

    componentWillUpdate(nextProps, nextState){
	if (this.state.active.id !== nextState.active.id) {
	    this.map.setLayoutProperty(nextState.active.id, 'visibility', 'visible');
	    this.map.setLayoutProperty(this.state.active.id, 'visibility', 'none');
            this.setState({ id: this.state.active.id });
	}
    };

    createMap() {	
	this.map = new mapboxgl.Map({
	    container: this.mapContainer,
	    style: 'mapbox://styles/mapbox/light-v9',
	    center: [9.191383, 45.464211],
	    zoom: 11
	});

	var map = this.map;

	map.on('load', () => {
	    map.addSource('Quartieri', {
		type: 'geojson',
		data: quartieriGeojson
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
		id: 'Quartieri-line',
		type: 'line',
		paint: {'line-opacity': 0.7},
		source: 'Quartieri'
	    }, this.firstSymbolId);

	    this.layers.forEach((l, i) => this.addLayer(l, i+1));
	    map.setLayoutProperty(this.state.active.id, 'visibility', 'visible');
	});

    };

    render() {
	const renderToggle = (layer, i) => {    	    
	    return (
		    <label key={i} className="toggle-container">
		        <input onChange={() => this.setState({ active: layer })} checked={layer.id === this.state.active.id} name="toggle" type="radio" />
		        <div className="toggle txt-s py3 toggle--active-white">{layer.label}</div>
		    </label>
	    );
	};
	
	return (
	    <div>
		<div id='mapContainer'
	            ref={el => this.mapContainer = el}
	            style={{
		        height: '90vh',
		        width: '100vw'
	            }}
		/>
		<div className='toggle-group absolute top left ml12 mt12 border border--2 border--white bg-white shadow-darken10 z1'>
                    {this.layers.map(renderToggle)}
                </div>
                <div className='legend-overlay'
                    id='legend'>
                    <Legend
                        stops={this.state.active.paint['circle-color'].stops}
                        style={{
                            width: 700,
                            height: 60
                        }}
                    />
                </div>
	    </div>
	);
    };
};

export default App;

