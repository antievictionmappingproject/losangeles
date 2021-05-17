$( document ).ready(function() {

  /*Tooltip showing address info*/
  var tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("z-index", "60")
  .style("visibility", "hidden")
  .text("tooltip");

  /*Initialize Leaflet Map*/
  var map = new L.Map("map", {
    center: [37.7756, -122.41],
    minZoom: 10,
    zoom: 13
  })
  .addLayer(new L.TileLayer("http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png"));

  /* Initialize the SVG layer */
  map._initPathRoot()    

  /* Pass map SVG layer to d3 */
  var svg = d3.select("#map").select("svg"),
  g = svg.append("g");

  /*Animation Timing Variables*/
  var startingTime = 852408700000;
  var step = 1500000000;
  var maxTime;
  var timer;
  var isPlaying = false;
  var counterTime = startingTime;
  
  /*Load data file from cartoDB and initialize coordinates*/
  var sql = new cartodb.SQL({ user: 'ampitup', format: 'geojson'});
  sql.execute("SELECT the_geom, date_filed, address, units, type, demo_count_at_date, ellis_count_at_date, omi_count_at_date, condo_count_at_date, roommate_count_at_date, fault_count_at_date, lead_remediation_count_at_date, total_count_at_date FROM sf_evictions_2015 WHERE date_filed IS NOT NULL ORDER BY date_filed ASC", {table_name: 'sf_evictions_2015'})

  .done(function(collection) {
    maxTime =  Date.parse(collection.features[collection.features.length-1].properties.date_filed)+1000000;
    counterTime = maxTime;
        collection.features.forEach(function(d) {
          if (d.geometry == null) {}
          else {
          d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0]);
	  }
	  //console.log(d.LatLng)
        });

        /*Add an svg group for each data point*/
        var node = g.selectAll(".node").data(collection.features).enter().append("g");
        var feature = node.append("circle")
        .attr("r", function(d) { return 1+d.properties.units;})
        .attr("class",  "center")
        .style("stroke", function(d) { 
         if(d.properties.type == "OMI"){
          return "#606";} else if(d.properties.type == "DEMO"){
            return "#066";}
	    else if(d.properties.type == "fault"){
            return "#066";}
	    else if(d.properties.type == "roommate"){
            return "#066";}
	    else if(d.properties.type == "lead_remediation"){
            return "#066";}
	    else if(d.properties.type == "condo"){
            return "#066";}
	    
          return "#f30";
        });
        /*show node info on mouseover*/
        node.on("mouseover", function(d){
          var fullDate = d.properties.date_filed;
          var thisYear = new Date(fullDate).getFullYear();
          var currMonth = new Date(fullDate).getMonth()+1;
          var currDay = new Date(fullDate).getDate();
          var units = d.properties.units;
          var unitText = units + " eviction";
          if(units > 1){
            unitText = units + " evictions"
          }
          var dateString = currMonth+"/"+currDay + "/"+thisYear;
          $(".tooltip").html(d.properties.address+ "<br>"+unitText+"<br>"+dateString);
          return tooltip.style("visibility", "visible");})
        .on("mousemove", function(){return tooltip.style("top",
          (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
        .on("click", function(d){
          tooltip.text(d.properties.address);
          return tooltip.style("visibility", "visible");})
        .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

        /*Initialize play button and slider*/
        $( "#play" ).click(togglePlay);
        $( "#slider" ).slider({ max: maxTime, min:startingTime, value: maxTime, step: step, start: function( event, ui ) {
         clearInterval(timer);
       }, change: function( event, ui ) {
        counterTime = $( "#slider" ).slider( "value" );
        filterCurrentPoints();
      }, slide: function( event, ui ) {
        counterTime = $( "#slider" ).slider( "value" );
        filterCurrentPoints();
      }, stop: function( event, ui ) {
        if(isPlaying){
          playAnimation();
        }
        filterCurrentPoints();
      }
    });

        /*Starting setup*/
        var currDate = new Date(counterTime).getFullYear();
        stopAnimation();
        filterCurrentPoints();
        map.on("zoomend", update);
        update();

        /*Filter map points by date*/
        function filterCurrentPoints(){
         var filtered = node.attr("visibility", "hidden")
         .filter(function(d) { return Date.parse(d.properties.date_filed) < counterTime}) 
         .attr("visibility", "visible");
         updateCounter(filtered[0].length-1);
       }

       /*Update map counters*/
       function updateCounter(index){
          var props = collection.features[index].properties;
          document.getElementById('ellisCount').innerHTML = props.ellis_count_at_date + " ";
          document.getElementById('omiCount').innerHTML = props.omi_count_at_date + " ";
          document.getElementById('demoCount').innerHTML = props.demo_count_at_date + " ";
	     document.getElementById('faultCount').innerHTML = props.fault_count_at_date + " ";
	     document.getElementById('roommateCount').innerHTML = props.roommate_count_at_date + " ";
          document.getElementById('lead_remediationCount').innerHTML = props.lead_remediation_count_at_date + " ";
          document.getElementById('condoCount').innerHTML = props.condo_count_at_date + " ";
          document.getElementById('totalCount').innerHTML = props.total_count_at_date + " ";
          currDate = new Date(counterTime).getFullYear();
          var currMonth = new Date(counterTime).getMonth()+1;
          var currDay = new Date(counterTime).getDate();
          document.getElementById('date').innerHTML = "1/1/1994 to " + currMonth+"/"+currDay + "/"+currDate;
        }

       /*Update slider*/
       function playAnimation(){
        counterTime = $( "#slider" ).slider( "value" );
        if(counterTime >=maxTime){
          $( "#slider" ).slider( "value", startingTime);
          
        }
        isPlaying = true;
        timer = setInterval(function() {
         counterTime += step; 
         $( "#slider" ).slider( "value", counterTime);
         if(counterTime >=maxTime){
          stopAnimation(); 
        }
      },500);

      }

     function stopAnimation(){
      clearInterval(timer);
      $('#play').css('background-image', 'url(images/play.png)');
      isPlaying = false;
    }

    /*Scale dots when map size or zoom is changed*/
    function update() {
      var up = map.getZoom()/13;
      node.attr("transform", function(d) {return "translate(" +  map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ") scale("+up+")"});

    }

    /*called when play/pause button is pressed*/
    function togglePlay(){
      if(isPlaying){
        stopAnimation();
      } else {
        $('#play').css('background-image', 'url(images/pause.png)');
        playAnimation();
      }
    }
  })

/*Show info about on mouseover*/
  $( ".popup" ).hide();
  $( ".triggerPopup" ).mouseover(function(e) {
    $( ".popup" ).position();
    var id = $(this).attr('id');
    if(id=="ellis"){
      $( "#ellisPopup" ).show();
    } else if (id=="omi"){
      $( "#omiPopup" ).show();
    } else {
      $( "#demoPopup" ).show();  
    }
      
    $('.popup').css("top", e.pageY+20);
  });

  $( ".triggerPopup" ).on("mouseout", function(){ $( ".popup" ).hide();});
});
