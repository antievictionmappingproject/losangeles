 $( document ).ready(function() {

 var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "60")
    .style("visibility", "hidden")
    .text("a simple tooltip");
 
 /*Initialize Leaflet Map*/
 var map = new L.Map("map", {
      center: [37.7756, -122.4193],
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
      var startingTime = 861667200000;
      var step = 1500000000;
      var maxTime = 1357167200000;
      var inititalZoom = 13;
      var timer;
      var isPlaying = true;
       var counterTime = startingTime;
  
  /*Load data file and initialize coordinates*/

   var sql = new cartodb.SQL({ user: 'ampitup', format: 'geojson'});
 
    /*Load from CartoDB database*/
    sql.execute("SELECT the_geom, date_filed, units, address_1 FROM {{table_name}} WHERE the_geom IS NOT NULL ORDER BY date_filed ASC", {table_name: 'ellis_updated_2_13'})
 /* var sql = new cartodb.SQL({ user: 'ojack', format: 'geojson'});
 
    /*Load from CartoDB database*
    sql.execute("SELECT the_geom, date_filed,address FROM {{table_name}} WHERE the_geom IS NOT NULL ORDER BY date_filed DESC", {table_name: 'sf_ellis_petitions'})*/
      .done(function(collection) {
        var cumEvictions = 0;//total number of evictions
        maxTime =  Date.parse(collection.features[collection.features.length-1].properties.date_filed)+1000000;
        console.log(maxTime);
        collection.features.forEach(function(d) {
      d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0]);
      cumEvictions += d.properties.units;
      d.totalEvictions = cumEvictions;
      console.log(d.properties.date_filed + " with " + d.totalEvictions);
    });

    /*Load from local file*/
   /*  d3.json("sf_ellis_petitions.json", function(collection) {
      collection.features.forEach(function(d) {
      d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0]);
    })*/
  
  /*Add an svg group for each data point*/
   var node = g.selectAll(".node").data(collection.features).enter().append("g");

    var feature = node.append("circle")
       .attr("r", function(d) { return d.properties.units;})
      .attr("class", "center");

   node.on("mouseover", function(d){
    tooltip.text(d.properties.address_1);
    return tooltip.style("visibility", "visible");})
.on("mousemove", function(){return tooltip.style("top",
    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
.on("click", function(d){
    tooltip.text(d.properties.address_1);
    return tooltip.style("visibility", "visible");})
.on("mouseout", function(){return tooltip.style("visibility", "hidden");});

       $( "#play" ).click(togglePlay);
       $( "#slider" ).slider({ max: maxTime, min:counterTime, start: function( event, ui ) {
         clearInterval(timer);
      }, change: function( event, ui ) {
        counterTime = $( "#slider" ).slider( "value" );
        updateCounter();
         updateMap();
      
      }, slide: function( event, ui ) {
        counterTime = $( "#slider" ).slider( "value" );
        updateCounter();
        updateMap();
       
      }, stop: function( event, ui ) {
        if(isPlaying){
        playAnimation();
      }
      }
     });

    var currDate = new Date(counterTime).getFullYear();
     playAnimation();
    map.on("viewreset", update);
    update();

   /* function updateCounter(){
      var totalEvictions = getTotalEvictions();
      //$('#counter').text = totalEvictions+" ";
       document.getElementById('counter').innerHTML = totalEvictions + " ";
      console.log(totalEvictions);
    }*/
    function updateMap(){
     
     var filtered = node.attr("visibility", "hidden")
      /*Show all dots with date before time*/
      .filter(function(d) { return Date.parse(d.properties.date_filed) < counterTime}) 
         .attr("visibility", "visible");
          console.log(" index "+ filtered.length-1);
          updateCounter(filtered[0].length-1);
        /*Animate most recent evictions*/
        filtered.filter(function(d) { 

        return Date.parse(d.properties.date_filed) > counterTime-step}) 
      .append("circle")
          .attr("r", 4)
           .style("fill","red")
          .style("fill-opacity", 0.8)
          .transition()

          .duration(800)
          .ease(Math.sqrt)
          .attr("r", function(d) { return d.properties.units*30;})
            .style("fill","#f40")
          .style("fill-opacity", 1e-6)
          .remove();


           /*var mostRecent; = node.select(function(d) { return Date.parse(d.properties.date_filed) < counterTime})[0][0];
           for(var i = 0; i < collection.features.length; i ++){
              if()
           }*/
          
     

        
        
        
    }

    /*Update map counters*/
       function updateCounter(index){
          currDate = new Date(counterTime).getFullYear();
        var currMonth = new Date(counterTime).getMonth();
        var currDay = new Date(counterTime).getDate();
        if(currMonth==0){
          currMonth = 12;
          currDate --;
        }
       
        document.getElementById('date').innerHTML = "1/1/1997 - " + currMonth+"/"+currDay + "/"+currDate;
          var totalEvictions = collection.features[index].properties;
          document.getElementById('counter').innerHTML = totalEvictions + " ";
        }
   // quake();
   function getTotalEvictions(){
    for(var i = 0; i < collection.features.length; i ++){
              if(Date.parse(collection.features[i].properties.date_filed)< counterTime){
                return collection.features[i].totalEvictions;
              }
           }
      return 0;
   }

   function showNode(selection){
     //console.log("selected " + JSON.stringify(selection));
   }
   
   /*Update slider*/
     function playAnimation(){
        counterTime = $( "#slider" ).slider( "value" );
        if(counterTime >=maxTime){
          $( "#slider" ).slider( "value", startingTime);
          
         }
        isPlaying = true;
        console.log("playAnimation called");
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
      updateMap();
      node.attr("transform", function(d) {return "translate(" +  map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ") scale("+map.getZoom()/13+")"});
        
    }
  

 function togglePlay(){
    if(isPlaying){
      stopAnimation();
    } else {
      $('#play').css('background-image', 'url(images/pause.png)');
      playAnimation();
       }
     }
})
});

