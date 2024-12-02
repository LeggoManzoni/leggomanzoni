// Create root element
var root = am5.Root.new("schoolMapDiv");  // Changed to new div id

// Set themes
root.setThemes([am5themes_Animated.new(root)]);

// Create the map chart
var chart = root.container.children.push(am5map.MapChart.new(root, {
  panX: "rotateX",
  panY: "translateY",
  projection: am5map.geoMercator(),
  homeGeoPoint: { longitude: 12, latitude: 42 }, // Center on Italy
  homeZoomLevel: 5
}));

// Create main polygon series for countries
var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  include: ["IT"] // Only show Italy
}));

polygonSeries.mapPolygons.template.setAll({
  fill: am5.color(0xDDDDDD),
  fillOpacity: 0.6,
  strokeWidth: 0.5
});

// Create point series for markers
var pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));

pointSeries.bullets.push(function() {
  var circle = am5.Circle.new(root, {
    radius: 5,
    fill: am5.color(0xFF0000),
    tooltip: am5.Tooltip.new(root, {
      labelText: "{name} ({city})"
    })
  });

  circle.states.create("hover", {
    radius: 7,
    fill: am5.color(0xff7b7b)
  });

  return am5.Bullet.new(root, {
    sprite: circle
  });
});

const schoolCoordinates = [
    {
      name: "IIS Bachelet",
      city: "Lecco",
      coordinates: [45.8557, 9.3977]
    },
    {
      name: "Liceo Carlo Alberto",
      city: "Novara",
      coordinates: [45.4465, 8.6227]
    },
    {
      name: "ISS A. Checchi",
      city: "Firenze",
      coordinates: [43.7696, 11.2558]
    },
    {
      name: "IIS Ugo Foscolo",
      city: "Agrigento",
      coordinates: [37.3109, 13.5764]
    },
    {
      name: "Liceo Gonzaga",
      city: "Mantova",
      coordinates: [45.1564, 10.7914]
    },
    {
      name: "Liceo Sant'Alberto Magno",
      city: "Bologna",
      coordinates: [44.4949, 11.3426]
    },
    {
      name: "Liceo Ettore Majorana",
      city: "Catania",
      coordinates: [37.5079, 15.0830]
    },
    {
      name: "Liceo Angelo Messedaglia",
      city: "Verona",
      coordinates: [45.4384, 10.9917]
    },
    {
      name: "Liceo Minghetti",
      city: "Bologna",
      coordinates: [44.4949, 11.3426]
    },
    {
      name: "Liceo G. Palmieri",
      city: "Lecce",
      coordinates: [40.3516, 18.1718]
    },
    {
      name: "ISS Domenico Romanazzi",
      city: "Bari",
      coordinates: [41.1171, 16.8719]
    },
    {
      name: "Liceo Bertrand Russell",
      city: "Roma",
      coordinates: [41.9028, 12.4964]
    },
    {
      name: "Liceo Sabin",
      city: "Bologna",
      coordinates: [44.4949, 11.3426]
    },
    {
      name: "Liceo Socrate",
      city: "Roma",
      coordinates: [41.9028, 12.4964]
    },
    {
      name: "Liceo Torquato Tasso",
      city: "Roma",
      coordinates: [41.9028, 12.4964]
    },
    {
      name: "Liceo Giulio Cesare Valgimigli",
      city: "Rimini",
      coordinates: [44.0678, 12.5695]
    },
    {
      name: "Liceo Vida",
      city: "Cremona",
      coordinates: [45.1367, 10.0242]
    },
    {
      name: "Liceo Villari",
      city: "Napoli",
      coordinates: [40.8518, 14.2681]
    },
    {
      name: "Liceo Wiligelmo",
      city: "Modena",
      coordinates: [44.6471, 10.9252]
    }
  ];

// Add data to the point series
pointSeries.data.setAll(schoolCoordinates);

// Add zoom control
chart.set("zoomControl", am5map.ZoomControl.new(root, {}));

// Make stuff animate on load
chart.appear(1000, 100);