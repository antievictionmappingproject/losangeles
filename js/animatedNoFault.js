$( document ).ready(function() {

var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "60")
    .style("visibility", "hidden")
    .text("tooltip");
 
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
      var startingTime = 852408700000;
    //  var step = 1500000000;
   // var step = 800000000;
    var step = 500000000;
      //var maxTime = 1357167200000;
      var maxTime = 2357167200000;
      var inititalZoom = 13;
      var timer;
      var isPlaying = true;
       var counterTime = startingTime;
       var currIndex = 0;
       var cumEvictions = 6501;//total number of evictions
        var totalEllis = 3693;//total ellis act evictions
        var totalOmi = 1687;
        var totalDemo = 1121;
  
  /*Load data file and initialize coordinates*/

  var sql = new cartodb.SQL({ user: 'ampitup', format: 'geojson'});
 
    /*Load from CartoDB database*/
   /* sql.execute("SELECT the_geom, date_filed, address_1, units, '1' as type FROM demolition_data_1997_oct_2013 WHERE the_geom IS NOT NULL " + 
      "UNION SELECT the_geom, date_filed, address_1, 1 as units, '2' as type FROM omi_1997_oct_2013 WHERE the_geom IS NOT NULL" + 
      " ORDER BY date_filed DESC", {table_name: 'demolition_data_1997_oct_2013'})*/
  
     sql.execute("SELECT the_geom, date_filed, address_1, units, type FROM no_fault_evictions_by_count WHERE the_geom IS NOT NULL ORDER BY date_filed DESC", {table_name: 'no_fault_evictions'})
 /* var sql = new cartodb.SQL({ user: 'ojack', format: 'geojson'});
 
    /*Load from CartoDB database*
    sql.execute("SELECT the_geom, date_filed,address FROM {{table_name}} WHERE the_geom IS NOT NULL ORDER BY date_filed DESC", {table_name: 'sf_ellis_petitions'})*/
      .done(function(collection) {
       var ellisCount = totalEllis;
       var cumCount = cumEvictions;
       var omiCount = totalOmi;
       var demoCount = totalDemo;
        maxTime =  Date.parse(collection.features[0].properties.date_filed)+1000000;

        //console.log(maxTime);
        collection.features.forEach(function(d) {
      d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0]);
      cumCount -= d.properties.units;
      d.properties.totalCount = cumCount;
     // d.totalEvictions = cumEvictions;
      if(d.properties.type=="ELLIS"){
        ellisCount-= d.properties.units;
      } else if (d.properties.type=="DEMO"){
        demoCount-= d.properties.units;
      } else {
        omiCount-= d.properties.units;
      } 
      d.properties.ellisCount = ellisCount;
      d.properties.omiCount = omiCount;
      d.properties.demoCount = demoCount;
      console.log(d.properties.date_filed + " with " + d.properties.total + "ellis " + totalEllis + " omi: "+totalOmi + " demo: "+ totalDemo);
    });

    /*Load from local file*/
   /*  d3.json("sf_ellis_petitions.json", function(collection) {
      collection.features.forEach(function(d) {
      d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0]);
    })*/
  
  /*Add an svg group for each data point*/
   var node = g.selectAll(".node").data(collection.features).enter().append("g");

    var feature = node.append("circle")
       .attr("r", function(d) { return 1+d.properties.units;})
      .attr("class",  "center")
      .style("stroke", function(d) { 
       if(d.properties.type == "OMI"){
        return "#606";} else if(d.properties.type == "DEMO"){
          return "#066";
        }
         return "#f30";
       });

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
      /*  if(currMonth==0){
          currMonth = 12;
          currDate --;
        }*/
       
     var dateString = currMonth+"/"+currDay + "/"+thisYear;
    $(".tooltip").html(d.properties.address_1+ "<br>"+unitText+"<br>"+dateString);
    //tooltip.text(d.properties.address_1);
    return tooltip.style("visibility", "visible");})
.on("mousemove", function(){return tooltip.style("top",
    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
.on("click", function(d){
    tooltip.text(d.properties.address_1);
    return tooltip.style("visibility", "visible");})
.on("mouseout", function(){return tooltip.style("visibility", "hidden");});

       $( "#play" ).click(togglePlay);

       console.log("max time is" + maxTime + "counter time is " + counterTime);
       $( "#slider" ).slider({ max: maxTime, min:counterTime, start: function( event, ui ) {
         clearInterval(timer);
         console.log("slider");
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

    function updateCounter(){
     /* var totalEvictions = getTotalEvictions();
      //$('#counter').text = totalEvictions+" ";
       document.getElementById('counter').innerHTML = totalEvictions + " ";
      console.log(totalEvictions);*/
      
                // document.getElementById('counter').innerHTML = totalEvictions + " ";

                var index = getCurrentIndex();
                if(index >0 ){
                var props = collection.features[index].properties;
                document.getElementById('ellisCount').innerHTML = props.ellisCount + " ";
                 document.getElementById('omiCount').innerHTML = props.omiCount + " ";
                 document.getElementById('demoCount').innerHTML = props.demoCount + " ";
                 document.getElementById('totalCount').innerHTML = props.totalCount + " ";
               } else {
                  document.getElementById('ellisCount').innerHTML = totalEllis + " ";
                 document.getElementById('omiCount').innerHTML = totalOmi + " ";
                 document.getElementById('demoCount').innerHTML = totalDemo + " ";
                 document.getElementById('totalCount').innerHTML = cumEvictions + " ";
               }
                // console.log(props.totalCount);
                //return props.total;
              //}
          // }

    }


    function getCurrentIndex(){
        //if(Date.parse(collection.features[currIndex].properties.date_filed)< counterTime) currIndex = 0;
        for(var i = 0; i < collection.features.length; i ++){
              if(Date.parse(collection.features[i].properties.date_filed)< counterTime){
                return i-1;
              }
            }
          return collection.features.length-1;

    }
    function updateMap(){
     
      node.attr("visibility", "hidden")
      /*Show all dots with date before time*/
      .filter(function(d) { return Date.parse(d.properties.date_filed) < counterTime}) 
         .attr("visibility", "visible")
        /*Animate most recent evictions*/
        .filter(function(d) { 

        return Date.parse(d.properties.date_filed) > counterTime-step}) 
      .append("circle")
          .attr("r", 4)
          .style("fill", function(d) { 
       if(d.properties.type == "OMI"){
        return "#606";} else if(d.properties.type == "DEMO"){
          return "#066";
        }
         return "#f30";
       })
          .style("fill-opacity", 1)
          .transition()
          //.duration(2000)
          .duration(800)
          .ease(Math.sqrt)
          .attr("r", function(d) { return (1+d.properties.units)*20;})
          .style("fill","#000")
          .style("fill-opacity", 1e-6)
          .remove();

           /*var mostRecent; = node.select(function(d) { return Date.parse(d.properties.date_filed) < counterTime})[0][0];
           for(var i = 0; i < collection.features.length; i ++){
              if()
           }*/
          
     

        currDate = new Date(counterTime).getFullYear();
        var currMonth = new Date(counterTime).getMonth()+1;
        var currDay = new Date(counterTime).getDate();
      /*  if(currMonth==0){
          currMonth = 12;
          currDate --;
        }*/
       
        document.getElementById('date').innerHTML = "1/1/1997 to " + currMonth+"/"+currDay + "/"+currDate;
        
        
    }
   // quake();
   function getTotalEvictions(){
    
                var props = collection.features[getCurrIndex()].properties;
                document.getElementById('ellisCount').innerHTML = props.ellisCount + " ";
                 document.getElementById('omiCount').innerHTML = props.omiCount + " ";
                 document.getElementById('demoCount').innerHTML = props.demoCount + " ";
                 document.getElementById('counter').innerHTML = props.total + " ";
               
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
       // console.log("playAnimation called");
        timer = setInterval(function() {
       counterTime += step; 
        $( "#slider" ).slider( "value", counterTime);
         if(counterTime >=maxTime){
          stopAnimation(); 
         }
     // },500);
      },150);

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