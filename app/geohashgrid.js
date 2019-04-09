var map, view, zoomSpan, extentsSpan, Geohash, watchUtils, webMercatorUtils, Graphic
	gridParts = [],
	defaults = {
		zoom: 3,
		maxDisplay: 10240,
		geohashPrecision: 12,
		geohashZoomScale: [
		// 00, 01, 02, 03, 04, 05, 06, 07, 08, 09, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24
			1,  1,  2,  2,  2,  3,  3,  3,  4,  4,  4,  5,  5,  5,  6,  6,  6,  7,  7,  7,  8,  8,  8,  9,  9,  9
		]
	};

require(["esri/Map", "esri/views/MapView", "app/latlon-geohash", "esri/core/watchUtils", "esri/geometry/support/webMercatorUtils", "esri/Graphic"], function(Map, MapView, _GeoHash, _watchUtils, _webMercatorUtils, _Graphic) {
	Geohash = _GeoHash;
	watchUtils = _watchUtils;
	webMercatorUtils = _webMercatorUtils;
	Graphic = _Graphic;

	map = new Map({
	  basemap: "streets"
	});

	view = new MapView({
		container: "map", // Reference to the DOM node that will contain the view
		map: map // References the map object created in step 3
		});
		
		view.when((evt) => initialize());
  });



function initialize() {
	zoomSpan = document.getElementById('zoom');
	extentsSpan = document.getElementById('extents');

	updateBoundsAndZoom();

	watchUtils.whenTrue(view, "stationary", function() {
		console.log("stop");
		mapIdle();
	});
	watchUtils.watch(view, "extent", function() {
		console.log("zoom");
		updateBoundsAndZoom();
	});
	//google.maps.event.addListener(map, 'zoom_changed', updateZoom);
	//google.maps.event.addListener(map, 'bounds_changed', updateBounds);
	//google.maps.event.addListener(map, 'idle', mapIdle);
}

function updateBoundsAndZoom() {
	extentsSpan.innerHTML = view.extent;
	zoomSpan.innerHTML = view.zoom + ' (' + defaults.geohashZoomScale[view.zoom] + ')'
}

function mapIdle() {
	drawGrid();
}

function eraseGrid() {
	view.graphics.removeAll();
}

function drawGrid() {
	var level = defaults.geohashZoomScale[view.zoom],
		bounds = webMercatorUtils.webMercatorToGeographic(view.extent),
	    neHash = Geohash.encode(bounds.ymax, bounds.xmax, level),
	    nwHash = Geohash.encode(bounds.ymax, bounds.xmin, level),
	    swHash = Geohash.encode(bounds.ymin, bounds.xmin, level),
	    seHash = Geohash.encode(bounds.ymin, bounds.xmax, level),
	    current = neHash,
	    eastBound = neHash,
	    westBound = nwHash,
	    maxHash = defaults.maxDisplay;

	eraseGrid();
	while (maxHash-- > 0) {
		drawBox(current);
		do {
			current = Geohash.adjacent(current, 'w');
			drawBox(current);
		} while (maxHash-- > 0 && current != westBound);
		if (current == swHash) {
			return;
		}
		westBound = Geohash.adjacent(current, 's');
		current = eastBound = Geohash.adjacent(eastBound, 's');
	}
	alert("defaults.maxDisplay limit reached");
	eraseGrid();
}

function drawBox(hash) {
	var b = Geohash.bounds(hash);
	var c = Geohash.decode(hash);

	var polygon = {
		type: "polygon", // autocasts as new Polygon()
		rings: [
			[b.sw.lon, b.sw.lat],
			[b.sw.lon, b.ne.lat],
			[b.ne.lon, b.ne.lat],
			[b.ne.lon, b.sw.lat]
		]
	};

	// Create a symbol for rendering the graphic
	var fillSymbol = {
		type: "simple-fill", // autocasts as new SimpleFillSymbol()
		color: [227, 139, 79, 0.2],
		outline: {
			// autocasts as new SimpleLineSymbol()
			color: [255, 255, 255],
			width: 1
		}
	};

	var polygonGraphic = new Graphic({
		geometry: polygon,
		symbol: fillSymbol
	});

	var point = {
		type: "point",
		latitude: c.lat,
		longitude: c.lon
	};
	
	var pointSymbol = {
		type: "text",  // autocasts as new TextSymbol()
		color: "white",
		haloColor: "black",
		haloSize: "1px",
		text: hash,
		xoffset: 3,
		yoffset: 3,
		font: {  // autocast as new Font()
			size: 12,
			family: "sans-serif",
			weight: "bold"
		}
	};

	var pointGraphic = new Graphic({
		geometry: point,
		symbol: pointSymbol
	});

	view.graphics.addMany([polygonGraphic, pointGraphic]);
}
