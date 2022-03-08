export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1Ijoib21lcmF0YXlpbG1heiIsImEiOiJja3psOGNhNzcyY2ppMnVvY3Rnd2M4bmR0In0.jNFBu76Zf600ep7tv_Vd2w";
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/omeratayilmaz/ckzl9cdgj00f214l817qvkg1z",
    /*   center: [-118.113491, 34.111745],
zoom: 4,
interactive: false, */
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Create marker
    const el = document.createElement("div");
    el.className = "marker";
    //Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup marker
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}:${loc.description}</p>`)
      .addTo(map);
    //Extends the map bounds to current location
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
