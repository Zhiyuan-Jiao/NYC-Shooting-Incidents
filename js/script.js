mapboxgl.accessToken = 'pk.eyJ1Ijoia2Vyd2luamlhbyIsImEiOiJja3FneGRqZDEwMDkxMnZvYWJxcGp1ODNlIn0.SfmxLJDtVrLrWzGiKCXpVg';

        const map = new mapboxgl.Map({
        container: 'map', // container element id
        style: 'mapbox://styles/kerwinjiao/ckx481ndu0t3i14mzli0wflo4',
        center: [-74.0059, 40.7128], // initial map center in [lon, lat]
        zoom: 15.5
        });

        map.on('load', () => {
            // Insert the layer beneath any symbol layer.
            const layers = map.getStyle().layers;
            const labelLayerId = layers.find(
                (layer) => layer.type === 'symbol' && layer.layout['text-field']
            ).id;
            
            // The 'building' layer in the Mapbox Streets
            // vector tileset contains building height data
            // from OpenStreetMap.
            map.addLayer(
                {
                'id': 'add-3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 10,
                'paint': {
                'fill-extrusion-color': '#aaa',
                
                // Use an 'interpolate' expression to
                // add a smooth transition effect to
                // the buildings as the user zooms in.
                'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
                ],
                'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
                }
                },
                labelLayerId
            );
        });

        map.on('load', () => {
            map.addLayer({
                id: 'collisions',
                type: 'circle',
                source: {
                type: 'geojson',
                data: 'assets/NYPD Shooting Incident Data (Historic).geojson' // data comes in
                },
                paint: {
                'circle-color': '#AA5E79',
                'circle-opacity': 0.7
                },
            });
        });

        // const marker = new mapboxgl.Marker() // Initialize a new marker
        // .setLngLat([-74.0059, 40.7128]) // Marker [lng, lat] coordinates
        // .addTo(map); // Add the marker to the map

        const geocoder = new MapboxGeocoder({
            // Initialize the geocoder
            accessToken: mapboxgl.accessToken, // Set the access token
            mapboxgl: mapboxgl, // Set the mapbox-gl instance
            marker: false, // Do not use the default marker style
            placeholder: 'Search for places in NYC', // Placeholder text for the search bar
            bbox: [-74.124115,40.662391,-73.876922,40.765053], // Boundary for NYC
            proximity: {
                longitude: -74.0059,
                latitude: 40.7128
            } // Coordinates of NYC
        });
        
        // Add the geocoder to the map
        map.addControl(geocoder);
        
        // After the map style has loaded on the page,
        // add a source layer and default styling for a single point
        map.on('load', () => {
            map.addSource('single-point', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': []
                }
            });
        
            map.addLayer({
                'id': 'point',
                'source': 'single-point',
                'type': 'circle',
                'paint': {
                    'circle-radius': 10,
                    'circle-color': '#448ee4'
                }
            });

            // Listen for the `result` event from the Geocoder // `result` event is triggered when a user makes a selection
            //  Add a marker at the result's coordinates
            geocoder.on('result', (event) => {
                map.getSource('single-point').setData(event.result.geometry);
            });

            // Create a popup, but don't add it to the map yet.
            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });
            
            map.on('mouseenter', 'collisions', (e) => {
            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = 'pointer';
            
            // Copy coordinates array.
            const coordinates = e.features[0].geometry.coordinates.slice();
            const occur_date = e.features[0].properties.occur_date;
            const occur_time = e.features[0].properties.occur_time;
            const death = e.features[0].properties.statistical_murder_flag;
            
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            
            // Populate the popup and set its coordinates
            // based on the feature found.
            popup.setLngLat(coordinates).setHTML("Occur date: " + occur_date.slice(0, 10) + "<br>Occur time: " + occur_time + "<br>Resulted in the victim’s death: " + death).addTo(map);
            });
            
            map.on('mouseleave', 'collisions', () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
            });
        });