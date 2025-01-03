$(document).ready(function () {

  /* Initialize animation variables. These will be generated dynamically from the cartoDB data */
  var startingTime, maxTime, counterTime, step, timer;

  /*Tooltip showing address info*/
  var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "60")
    .style("visibility", "hidden")
    .text("tooltip");

  // Initialize a map centered at (34.0953048,-118.265477) at zoom level 11
  var map = L.map('map').setView([34.0953048, -118.265477], 11);

  // Style URL format in XYZ PNG format; see our documentation for more options
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  /* Initialize the SVG layer */
  map._initPathRoot()

  /* Pass map SVG layer to d3 */
  var svg = d3.select("#map").select("svg"),
    g = svg.append("g");

  /*Animation Timing Variables*/
  var startingTime = 86166720000;
  var step = 1500000000;
  var maxTime;
  var timer;
  var isPlaying = false;
  var counterTime = startingTime;

  /*Load data file from cartoDB and initialize coordinates*/
  var sql = new cartodb.SQL({ user: 'ampitup', format: 'geojson' });

  sql.execute("SELECT the_geom, date, address, units FROM {{table_name}} WHERE the_geom IS NOT NULL ORDER BY date ASC", { table_name: 'la_2020' })
    .done(function (collection) {
      var cumEvictions = 0;
      startingTime = Date.parse(collection.features[0].properties.date) - 1000000;
      maxTime = Date.parse(collection.features[collection.features.length - 1].properties.date) + 4000000;
      counterTime = startingTime;
      collection.features.forEach(function (d) {
        d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
        cumEvictions += d.properties.units;
        d.properties.totalEvictions = cumEvictions;
      });


      /*Add an svg group for each data point*/
      var node = g.selectAll(".node").data(collection.features).enter().append("g");

      /*show node info on mouseover*/
      node.on("mouseover", function (d) {
        var fullDate = d.properties.date;
        var thisYear = new Date(fullDate).getFullYear();
        var currMonth = new Date(fullDate).getMonth() + 1;
        var currDay = new Date(fullDate).getDate();
        var units = d.properties.units;
        var unitText = units + " eviction";
        if (units > 1) {
          unitText = units + " evictions"
        }
        var dateString = currMonth + "/" + currDay + "/" + thisYear;
        $(".tooltip").html(d.properties.address_1 + "<br>" + d.properties.owner + "<br>" + unitText + "<br>" + dateString);
        return tooltip.style("visibility", "visible");
      })
        .on("mousemove", function () {
          return tooltip.style("top",
            (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("click", function (d) {
          tooltip.text(d.properties.address_1 + ", " + d.properties.owner);
          return tooltip.style("visibility", "visible");
        })
        .on("mouseout", function () { return tooltip.style("visibility", "hidden"); });

      /*Initialize play button and slider*/
      $("#play").click(togglePlay);
      $("#slider").slider({
        max: maxTime, min: startingTime, value: maxTime, step: step, start: function () {
          clearInterval(timer);
        }, change: function () {
          counterTime = $("#slider").slider("value");
          filterCurrentPoints();
        }, slide: function () {
          counterTime = $("#slider").slider("value");
          filterCurrentPoints();
        }, stop: function () {
          if (isPlaying) {
            playAnimation();
          }
          filterCurrentPoints();
        }
      });

      /*Starting setup*/
      var currDate = new Date(counterTime).getFullYear();
      //stopAnimation();
      filterCurrentPoints();
      map.on("zoomend", update);
      update();
      playAnimation();

      /*Filter map points by date*/
      function filterCurrentPoints() {
        var filtered = node.attr("visibility", "hidden")
          .filter(function (d) { return Date.parse(d.properties.date) < counterTime })
          .attr("visibility", "visible");
        // console.log(JSON.stringify(filtered[0]));
        // updateCounter(filtered[0].length-1);
        filtered.filter(function (d) {
          return Date.parse(d.properties.date) > counterTime - step
        })
          .append("circle")
          .attr("r", 8)
          .style("fill", "red")
          .style("fill-opacity", 0.8)
          .transition()

          .duration(800)
          .ease(Math.sqrt)
          .attr("r", function (d) { return d.properties.units * 10; })
          .style("fill", "#f40")
          .style("fill-opacity", 1e-6)
          .remove();
        updateCounter(filtered[0].length - 1);
      }

      /*Update map counters*/
      function updateCounter(index) {
        var totalEvictions = 0;
        if (index < 1) {

        } else {
          var props = collection.features[index].properties;
          totalEvictions = props.totalEvictions;
        }
        document.getElementById('counter').innerHTML = totalEvictions + " ";
        currDate = new Date(counterTime).getFullYear();
        var currMonth = new Date(counterTime).getMonth() + 1;
        var currDay = new Date(counterTime).getDate();

        document.getElementById('date').innerHTML = "1/1/1994 - " + currMonth + "/" + currDay + "/" + currDate;
      }

      /*Update slider*/
      function playAnimation() {
        counterTime = $("#slider").slider("value");
        if (counterTime >= maxTime) {
          $("#slider").slider("value", startingTime);

        }
        isPlaying = true;
        timer = setInterval(function () {
          counterTime += step;
          $("#slider").slider("value", counterTime);
          if (counterTime >= maxTime) {
            stopAnimation();
          }
        }, 500);

      }

      function stopAnimation() {
        clearInterval(timer);
        $('#play').css('background-image', 'url(images/play.png)');
        isPlaying = false;
      }

      /*Scale dots when map size or zoom is changed*/
      function update() {
        var up = map.getZoom() / 13;
        node.attr("transform", function (d) { return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ") scale(" + up + ")" });

      }

      /*called when play/pause button is pressed*/
      function togglePlay() {
        if (isPlaying) {
          stopAnimation();
        } else {
          $('#play').css('background-image', 'url(images/pause.png)');
          playAnimation();
        }
      }
    })


  /*Show info about on mouseover*/
  $(".popup").hide();
  $(".triggerPopup").mouseover(function (e) {
    $(".popup").position();
    var id = $(this).attr('id');
    if (id == "ellis") {
      $("#ellisPopup").show();
    } else if (id == "omi") {
      $("#omiPopup").show();
    } else {
      $("#demoPopup").show();
    }
    $('.popup').css("top", e.pageY + 20);
  });

  $(".triggerPopup").on("mouseout", function () { $(".popup").hide(); });
});



