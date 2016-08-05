(function() {
  var svg;

  // Save off default references
  var d3 = window.d3, topojson = window.topojson;

  var defaultOptions = {
    scope: 'world',
    responsive: false,
    aspectRatio: 0.5625,
    setProjection: setProjection,
    projection: 'equirectangular',
    dataType: 'json',
    data: {},
    done: function() {},
    fills: {
      defaultFill: '#ABDDA4'
    },
    filters: {},
    geographyConfig: {
        dataUrl: null,
        CountryId: null,
        hideAntarctica: true,
        hideHawaiiAndAlaska : false,
        borderWidth: 1,
        borderOpacity: 1,
        borderColor: '#FDFDFD',
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>';
        },
        popupOnHover: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1
    },
    projectionConfig: {
      rotation: [97, 0]
    },
    bubblesConfig: {
        borderWidth: 2,
        borderOpacity: 1,
        borderColor: '#FFFFFF',
        popupOnHover: true,
        radius: null,
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + data.name + '</strong></div>';
        },
        fillOpacity: 0.75,
        animate: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1,
        highlightFillOpacity: 0.85,
        exitDelay: 100,
        key: JSON.stringify
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600,
      popupOnHover: false,
      popupTemplate: function(geography, data) {
        // Case with latitude and longitude
        if ( ( data.origin && data.destination ) && data.origin.latitude && data.origin.longitude && data.destination.latitude && data.destination.longitude ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>Origin: ' + JSON.stringify(data.origin) + '<br>Destination: ' + JSON.stringify(data.destination) + '</div>';
        }
        // Case with only country name
        else if ( data.origin && data.destination ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>' + data.origin + ' -> ' + data.destination + '</div>';
        }
        // Missing information
        else {
          return '';
        }
      }
    }
  };

  /*
    Getter for value. If not declared on datumValue, look up the chain into optionsValue
  */
  function val( datumValue, optionsValue, context ) {
    if ( typeof context === 'undefined' ) {
      context = optionsValue;
      optionsValues = undefined;
    }
    var value = typeof datumValue !== 'undefined' ? datumValue : optionsValue;

    if (typeof value === 'undefined') {
      return  null;
    }

    if ( typeof value === 'function' ) {
      var fnContext = [context];
      if ( context.geography ) {
        fnContext = [context.geography, context.data];
      }
      return value.apply(null, fnContext);
    }
    else {
      return value;
    }
  }

  function addContainer( element, height, width ) {
    this.svg = d3.select( element ).append('svg')
      .attr('width', width || element.offsetWidth)
      .attr('data-width', width || element.offsetWidth)
      .attr('class', 'datamap')
      .attr('height', height || element.offsetHeight)
      .style('overflow', 'hidden'); // IE10+ doesn't respect height/width when map is zoomed in

    if (this.options.responsive) {
      d3.select(this.options.element).style({'position': 'relative', 'padding-bottom': (this.options.aspectRatio*100) + '%'});
      d3.select(this.options.element).select('svg').style({'position': 'absolute', 'width': '100%', 'height': '100%'});
      d3.select(this.options.element).select('svg').select('g').selectAll('path').style('vector-effect', 'non-scaling-stroke');

    }

    return this.svg;
  }

  // setProjection takes the svg element and options
  function setProjection( element, options ) {
    var width = options.width || element.offsetWidth;
    var height = options.height || element.offsetHeight;
    var projection, path;
    var svg = this.svg;

    if ( options && typeof options.scope === 'undefined') {
      options.scope = 'world';
    }

    if ( options.scope === 'usa' ) {
      projection = d3.geo.albersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
    }
    else if ( options.scope === 'world' ) {
      projection = d3.geo[options.projection]()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / (options.projection === "mercator" ? 1.45 : 1.8)]);
    }

    if ( options.projection === 'orthographic' ) {

      svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

      svg.append("use")
          .attr("class", "stroke")
          .attr("xlink:href", "#sphere");

      svg.append("use")
          .attr("class", "fill")
          .attr("xlink:href", "#sphere");
      projection.scale(250).clipAngle(90).rotate(options.projectionConfig.rotation);
    }

    path = d3.geo.path()
      .projection( projection );

    return {path: path, projection: projection};
  }

  function addStyleBlock() {
    if ( d3.select('.datamaps-style-block').empty() ) {
      d3.select('head').append('style').attr('class', 'datamaps-style-block')
      .html('.datamap path.datamaps-graticule { fill: none; stroke: #777; stroke-width: 0.5px; stroke-opacity: .5; pointer-events: none; } .datamap .labels {pointer-events: none;} .datamap path:not(.datamaps-arc), .datamap circle, .datamap line {stroke: #FFFFFF; vector-effect: non-scaling-stroke; stroke-width: 1px;} .datamaps-legend dt, .datamaps-legend dd { float: left; margin: 0 3px 0 0;} .datamaps-legend dd {width: 20px; margin-right: 6px; border-radius: 3px;} .datamaps-legend {padding-bottom: 20px; z-index: 1001; position: absolute; left: 4px; font-size: 12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;} .datamaps-hoverover {display: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .hoverinfo {padding: 4px; border-radius: 1px; background-color: #FFF; box-shadow: 1px 1px 5px #CCC; font-size: 12px; border: 1px solid #CCC; } .hoverinfo hr {border:1px dotted #CCC; }');
    }
  }

  function drawSubunits( data ) {
    var fillData = this.options.fills,
        colorCodeData = this.options.data || {},
        geoConfig = this.options.geographyConfig;

    var subunits = this.svg.select('g.datamaps-subunits');
    if ( subunits.empty() ) {
      subunits = this.addLayer('datamaps-subunits', null, true);
    }

    var geoData = topojson.feature( data, data.objects[ this.options.scope ] ).features;
    if ( geoConfig.hideAntarctica ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "ATA";
      });
    }

    if ( geoConfig.hideHawaiiAndAlaska ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "HI" && feature.id !== 'AK';
      });
    }

    var geo = subunits.selectAll('path.datamaps-subunit').data( geoData );

    geo.enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', function(d) {
        return 'datamaps-subunit ' + d.id;
      })
      .attr('data-info', function(d) {
        return JSON.stringify( colorCodeData[d.id]);
      })
      .style('fill', function(d) {
        // If fillKey - use that
        // Otherwise check 'fill'
        // Otherwise check 'defaultFill'
        var fillColor;

        var datum = colorCodeData[d.id];
        if ( datum && datum.fillKey ) {
          fillColor = fillData[ val(datum.fillKey, {data: colorCodeData[d.id], geography: d}) ];
        }

        if ( typeof fillColor === 'undefined' ) {
          fillColor = val(datum && datum.fillColor, fillData.defaultFill, {data: colorCodeData[d.id], geography: d});
        }

        return fillColor;
      })
      .style('stroke-width', geoConfig.borderWidth)
      .style('stroke-opacity', geoConfig.borderOpacity)
      .style('stroke', geoConfig.borderColor);
  }

  function handleGeographyConfig () {
    var hoverover;
    var svg = this.svg;
    var self = this;
    var options = this.options.geographyConfig;

    if ( options.highlightOnHover || options.popupOnHover ) {
      svg.selectAll('.datamaps-subunit')
        .on('mouseover', function(d) {
          var $this = d3.select(this);
          var datum = self.options.data[d.id] || {};
          if ( options.highlightOnHover ) {
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));

            // As per discussion on https://github.com/markmarkoh/datamaps/issues/19
            if ( ! /((MSIE)|(Trident))/.test(navigator.userAgent) ) {
             moveToFront.call(this);
            }
          }

          if ( options.popupOnHover ) {
            self.updatePopup($this, d, options, svg);
          }
        })
        .on('mouseout', function() {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }
          $this.on('mousemove', null);
          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        });
    }

    function moveToFront() {
      this.parentNode.appendChild(this);
    }
  }

  // Plugin to add a simple map legend
  function addLegend(layer, data, options) {
    data = data || {};
    if ( !this.options.fills ) {
      return;
    }

    var html = '<dl>';
    var label = '';
    if ( data.legendTitle ) {
      html = '<h2>' + data.legendTitle + '</h2>' + html;
    }
    for ( var fillKey in this.options.fills ) {

      if ( fillKey === 'defaultFill') {
        if (! data.defaultFillName ) {
          continue;
        }
        label = data.defaultFillName;
      } else {
        if (data.labels && data.labels[fillKey]) {
          label = data.labels[fillKey];
        } else {
          label= fillKey + ': ';
        }
      }
      html += '<dt>' + label + '</dt>';
      html += '<dd style="background-color:' +  this.options.fills[fillKey] + '">&nbsp;</dd>';
    }
    html += '</dl>';

    var hoverover = d3.select( this.options.element ).append('div')
      .attr('class', 'datamaps-legend')
      .html(html);
  }

    function addGraticule ( layer, options ) {
      var graticule = d3.geo.graticule();
      this.svg.insert("path", '.datamaps-subunits')
        .datum(graticule)
        .attr("class", "datamaps-graticule")
        .attr("d", this.path);
  }

  function handleArcs (layer, data, options) {
    var self = this,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - arcs must be an array";
    }

    // For some reason arc options were put in an `options` object instead of the parent arc
    // I don't like this, so to match bubbles and other plugins I'm moving it
    // This is to keep backwards compatability
    for ( var i = 0; i < data.length; i++ ) {
      data[i] = defaults(data[i], data[i].options);
      delete data[i].options;
    }

    if ( typeof options === "undefined" ) {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data( data, JSON.stringify );

    var path = d3.geo.path()
        .projection(self.projection);

    arcs
      .enter()
        .append('svg:path')
        .attr('class', 'datamaps-arc')
        .style('stroke-linecap', 'round')
        .style('stroke', function(datum) {
          return val(datum.strokeColor, options.strokeColor, datum);
        })
        .style('fill', 'none')
        .style('stroke-width', function(datum) {
            return val(datum.strokeWidth, options.strokeWidth, datum);
        })
        .attr('d', function(datum) {

            var originXY, destXY;

            if (typeof datum.origin === "string") {
               switch (datum.origin) {
                    case  "USA":
                        originXY = self.latLngToXY(41.140276, -100.760145);
                        break;
                    case "CAN":
                        originXY = self.latLngToXY(56.624472, -114.665293);
                        break;
                    case "JPN":
                        originXY = self.latLngToXY(35.689487, 139.691706);
                        break;
                    case "CHL":
                        originXY = self.latLngToXY(-33.448890, -70.669265);
                        break;
                    case "IDN":
                        originXY = self.latLngToXY(-6.208763, 106.845599);
                        break;
                    case "MYS":
                        originXY = self.latLngToXY(14.599512, 120.984219);
                        break;
                    case "NOR":
                        originXY = self.latLngToXY(59.913869, 10.752245);
                        break;
                    default: 
                        originXY = self.path.centroid(svg.select('path.' + datum.origin).data()[0]);
                }
            } else {
              originXY = self.latLngToXY(val(datum.origin.latitude, datum), val(datum.origin.longitude, datum));
            }

            if (typeof datum.destination === 'string') {
              switch (datum.destination) {
                    case "USA":
                        destXY = self.latLngToXY(41.140276, -100.760145);
                        break;
                    case "CAN":
                        destXY = self.latLngToXY(56.624472, -114.665293);
                        break;
                    case "JPN":
                        destXY = self.latLngToXY(35.689487, 139.691706);
                        break;
                    case "CHL":
                        destXY = self.latLngToXY(-33.448890, -70.669265);
                        break;
                    case "IDN":
                        destXY = self.latLngToXY(-6.208763, 106.845599);
                        break;
                    case "MYS":
                        destXY = self.latLngToXY(14.599512, 120.984219);
                        break;
                    case "NOR":
                        destXY = self.latLngToXY(59.913869, 10.752245);
                        break;
                    default:
                        destXY = self.path.centroid(svg.select('path.' + datum.destination).data()[0]);
              }
            } else {
              destXY = self.latLngToXY(val(datum.destination.latitude, datum), val(datum.destination.longitude, datum));
            }
            var midXY = [ (originXY[0] + destXY[0]) / 2, (originXY[1] + destXY[1]) / 2];
            if (options.greatArc) {
                  // TODO: Move this to inside `if` clause when setting attr `d`
              var greatArc = d3.geo.greatArc()
                  .source(function(d) { return [val(d.origin.longitude, d), val(d.origin.latitude, d)]; })
                  .target(function(d) { return [val(d.destination.longitude, d), val(d.destination.latitude, d)]; });

              return path(greatArc(datum));
            }
            var sharpness = val(datum.arcSharpness, options.arcSharpness, datum);
            return "M" + originXY[0] + ',' + originXY[1] + "S" + (midXY[0] + (50 * sharpness)) + "," + (midXY[1] - (75 * sharpness)) + "," + destXY[0] + "," + destXY[1];
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })
        .transition()
          .delay(100)
          .style('fill', function(datum) {
            /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
            var length = this.getTotalLength();
            this.style.transition = this.style.WebkitTransition = 'none';
            this.style.strokeDasharray = length + ' ' + length;
            this.style.strokeDashoffset = length;
            this.getBoundingClientRect();
            this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset ' + val(datum.animationSpeed, options.animationSpeed, datum) + 'ms ease-out';
            this.style.strokeDashoffset = '0';
            return 'none';
          });

    arcs.exit()
      .transition()
      .style('opacity', 0)
      .remove();
  }

  function handleLabels ( layer, options ) {
    var self = this;
    options = options || {};
    var labelStartCoodinates = this.projection([-67.707617, 42.722131]);
    this.svg.selectAll(".datamaps-subunit")
      .attr("data-foo", function(d) {
        var center = self.path.centroid(d);
        var xOffset = 7.5, yOffset = 5;

        if ( ["FL", "KY", "MI"].indexOf(d.id) > -1 ) xOffset = -2.5;
        if ( d.id === "NY" ) xOffset = -1;
        if ( d.id === "MI" ) yOffset = 18;
        if ( d.id === "LA" ) xOffset = 13;

        var x,y;

        x = center[0] - xOffset;
        y = center[1] + yOffset;

        var smallStateIndex = ["VT", "NH", "MA", "RI", "CT", "NJ", "DE", "MD", "DC"].indexOf(d.id);
        if ( smallStateIndex > -1) {
          var yStart = labelStartCoodinates[1];
          x = labelStartCoodinates[0];
          y = yStart + (smallStateIndex * (2+ (options.fontSize || 12)));
          layer.append("line")
            .attr("x1", x - 3)
            .attr("y1", y - 5)
            .attr("x2", center[0])
            .attr("y2", center[1])
            .style("stroke", options.labelColor || "#000")
            .style("stroke-width", options.lineWidth || 1);
        }

          layer.append("text")
              .attr("x", x)
              .attr("y", y)
              .style("font-size", (options.fontSize || 10) + 'px')
              .style("font-family", options.fontFamily || "Verdana")
              .style("fill", options.labelColor || "#000")
              .text(function() {
                  if (options.customLabelText && options.customLabelText[d.id]) {
                      return options.customLabelText[d.id];
                  } else {
                      return d.id;
                  }
              });

        return "bar";
      });
  }


  function handleBubbles (layer, data, options ) {
    var self = this,
        fillData = this.options.fills,
        filterData = this.options.filters,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - bubbles must be an array";
    }

    var bubbles = layer.selectAll('circle.datamaps-bubble').data( data, options.key );

    bubbles
      .enter()
        .append('svg:circle')
        .attr('class', 'datamaps-bubble')
        .attr('cx', function ( datum ) {return self.getXY(datum)[0];})
        .attr('cy', function ( datum ) { return self.getXY(datum)[1];})
        .attr('r', function(datum) {
          // If animation enabled start with radius 0, otherwise use full size.
          return options.animate ? 0 : val(datum.radius, options.radius, datum);
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .attr('filter', function (datum) {
          var filterKey = filterData[ val(datum.filterKey, options.filterKey, datum) ];

          if (filterKey) {
            return filterKey;
          }
        })
        .style('stroke', function ( datum ) {
          return val(datum.borderColor, options.borderColor, datum);
        })
        .style('stroke-width', function ( datum ) {
          return val(datum.borderWidth, options.borderWidth, datum);
        })
        .style('stroke-opacity', function ( datum ) {
          return val(datum.borderOpacity, options.borderOpacity, datum);
        })
        .style('fill-opacity', function ( datum ) {
          return val(datum.fillOpacity, options.fillOpacity, datum);
        })
        .style('fill', function ( datum ) {
          var fillColor = fillData[ val(datum.fillKey, options.fillKey, datum) ];
          return fillColor || fillData.defaultFill;
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Save all previous attributes for mouseout
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));
          }

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        });

    bubbles.transition()
      .duration(400)
      .attr('r', function ( datum ) {
        return val(datum.radius, options.radius, datum);
      })
    .transition()
      .duration(0)
      .attr('data-info', function(d) {
        return JSON.stringify(d);
      });

    bubbles.exit()
      .transition()
        .delay(options.exitDelay)
        .attr("r", 0)
        .remove();
  }

  function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (source) {
        for (var prop in source) {
          // Deep copy if property not set
          if (obj[prop] == null) {
            if (typeof source[prop] == 'function') {
              obj[prop] = source[prop];
            }
            else {
              obj[prop] = JSON.parse(JSON.stringify(source[prop]));
            }
          }
        }
      }
    });
    return obj;
  }
  /**************************************
             Public Functions
  ***************************************/

  function Datamap( options ) {

    if ( typeof d3 === 'undefined' || typeof topojson === 'undefined' ) {
      throw new Error('Include d3.js (v3.0.3 or greater) and topojson on this page before creating a new map');
   }
    // Set options for global use
    this.options = defaults(options, defaultOptions);
    this.options.geographyConfig = defaults(options.geographyConfig, defaultOptions.geographyConfig);
    this.options.projectionConfig = defaults(options.projectionConfig, defaultOptions.projectionConfig);
    this.options.bubblesConfig = defaults(options.bubblesConfig, defaultOptions.bubblesConfig);
    this.options.arcConfig = defaults(options.arcConfig, defaultOptions.arcConfig);

    // Add the SVG container
    if ( d3.select( this.options.element ).select('svg').length > 0 ) {
      addContainer.call(this, this.options.element, this.options.height, this.options.width );
    }

    // Add core plugins to this instance
    this.addPlugin('bubbles', handleBubbles);
    this.addPlugin('legend', addLegend);
    this.addPlugin('arc', handleArcs);
    this.addPlugin('labels', handleLabels);
    this.addPlugin('graticule', addGraticule);

    // Append style block with basic hoverover styles
    if ( ! this.options.disableDefaultStyles ) {
      addStyleBlock();
    }

    return this.draw();
  }

  // Resize map
  Datamap.prototype.resize = function () {

    var self = this;
    var options = self.options;

    if (options.responsive) {
      var newsize = options.element.clientWidth,
          oldsize = d3.select( options.element).select('svg').attr('data-width');

      d3.select(options.element).select('svg').selectAll('g').attr('transform', 'scale(' + (newsize / oldsize) + ')');
    }
  };

  // Actually draw the features(states & countries)
  Datamap.prototype.draw = function() {
    // Save off in a closure
    var self = this;
    var options = self.options;

    // Set projections and paths based on scope
    var pathAndProjection = options.setProjection.apply(this, [options.element, options] );

    this.path = pathAndProjection.path;
    this.projection = pathAndProjection.projection;

    // If custom URL for topojson data, retrieve it and render
    if ( options.geographyConfig.dataUrl ) {
      d3.json( options.geographyConfig.dataUrl, function(error, results) {
        if ( error ) throw new Error(error);

        // Map alternativ countryId to alpha3 code if specified in geographyConfig (countryId)
        // CountryId can be a simple string (eg 'id') or dot-notation reference to object property (eg "properties.alpha2code")
        if ( options.geographyConfig.countryId && results.objects[ self.options.scope ].geometries.length > 0) {
          var countryId = options.geographyConfig.countryId.split('.');
          var countries = results.objects[ self.options.scope ].geometries;
          countries.forEach( function (c) {
            var id = null;
            for (var i=0; i<countryId.length; i++){
              id = id ? id[countryId[i]] : c[countryId[i]];
            }
            c.id = self.iso3166(id) || c.id;
          });
        }

        self.customTopo = results;
        draw( results );
      });
    }
    else {
      draw( this[options.scope + 'Topo'] || options.geographyConfig.dataJson);
    }

    return this;

      function draw (data) {
        // If fetching remote data, draw the map first then call `updateChoropleth`
        if ( self.options.dataUrl ) {
          // Allow for csv or json data types
          d3[self.options.dataType](self.options.dataUrl, function(data) {
            // In the case of csv, transform data to object
            if ( self.options.dataType === 'csv' && (data && data.slice) ) {
              var tmpData = {};
              for(var i = 0; i < data.length; i++) {
                tmpData[data[i].id] = data[i];
              }
              data = tmpData;
            }
            Datamaps.prototype.updateChoropleth.call(self, data);
          });
        }
        drawSubunits.call(self, data);
        handleGeographyConfig.call(self);

        if ( self.options.geographyConfig.popupOnHover || self.options.bubblesConfig.popupOnHover) {
          hoverover = d3.select( self.options.element ).append('div')
            .attr('class', 'datamaps-hoverover')
            .style('z-index', 10001)
            .style('position', 'absolute');
        }

        // Fire off finished callback
        self.options.done(self);
      }
  };
  /**************************************
                TopoJSON
  ***************************************/
  Datamap.prototype.worldTopo = '__WORLD__';
  Datamap.prototype.abwTopo = '__ABW__';
  Datamap.prototype.afgTopo = '__AFG__';
  Datamap.prototype.agoTopo = '__AGO__';
  Datamap.prototype.aiaTopo = '__AIA__';
  Datamap.prototype.albTopo = '__ALB__';
  Datamap.prototype.aldTopo = '__ALD__';
  Datamap.prototype.andTopo = '__AND__';
  Datamap.prototype.areTopo = '__ARE__';
  Datamap.prototype.argTopo = '__ARG__';
  Datamap.prototype.armTopo = '__ARM__';
  Datamap.prototype.asmTopo = '__ASM__';
  Datamap.prototype.ataTopo = '__ATA__';
  Datamap.prototype.atcTopo = '__ATC__';
  Datamap.prototype.atfTopo = '__ATF__';
  Datamap.prototype.atgTopo = '__ATG__';
  Datamap.prototype.ausTopo = '__AUS__';
  Datamap.prototype.autTopo = '__AUT__';
  Datamap.prototype.azeTopo = '__AZE__';
  Datamap.prototype.bdiTopo = '__BDI__';
  Datamap.prototype.belTopo = '__BEL__';
  Datamap.prototype.benTopo = '__BEN__';
  Datamap.prototype.bfaTopo = '__BFA__';
  Datamap.prototype.bgdTopo = '__BGD__';
  Datamap.prototype.bgrTopo = '__BGR__';
  Datamap.prototype.bhrTopo = '__BHR__';
  Datamap.prototype.bhsTopo = '__BHS__';
  Datamap.prototype.bihTopo = '__BIH__';
  Datamap.prototype.bjnTopo = '__BJN__';
  Datamap.prototype.blmTopo = '__BLM__';
  Datamap.prototype.blrTopo = '__BLR__';
  Datamap.prototype.blzTopo = '__BLZ__';
  Datamap.prototype.bmuTopo = '__BMU__';
  Datamap.prototype.bolTopo = '__BOL__';
  Datamap.prototype.braTopo = '__BRA__';
  Datamap.prototype.brbTopo = '__BRB__';
  Datamap.prototype.brnTopo = '__BRN__';
  Datamap.prototype.btnTopo = '__BTN__';
  Datamap.prototype.norTopo = '__NOR__';
  Datamap.prototype.bwaTopo = '__BWA__';
  Datamap.prototype.cafTopo = '__CAF__';
  Datamap.prototype.canTopo = '__CAN__';
  Datamap.prototype.cheTopo = '__CHE__';
  Datamap.prototype.chlTopo = '__CHL__';
  Datamap.prototype.chnTopo = '__CHN__';
  Datamap.prototype.civTopo = '__CIV__';
  Datamap.prototype.clpTopo = '__CLP__';
  Datamap.prototype.cmrTopo = '__CMR__';
  Datamap.prototype.codTopo = '__COD__';
  Datamap.prototype.cogTopo = '__COG__';
  Datamap.prototype.cokTopo = '__COK__';
  Datamap.prototype.colTopo = '__COL__';
  Datamap.prototype.comTopo = '__COM__';
  Datamap.prototype.cpvTopo = '__CPV__';
  Datamap.prototype.criTopo = '__CRI__';
  Datamap.prototype.csiTopo = '__CSI__';
  Datamap.prototype.cubTopo = '__CUB__';
  Datamap.prototype.cuwTopo = '__CUW__';
  Datamap.prototype.cymTopo = '__CYM__';
  Datamap.prototype.cynTopo = '__CYN__';
  Datamap.prototype.cypTopo = '__CYP__';
  Datamap.prototype.czeTopo = '__CZE__';
  Datamap.prototype.deuTopo = '__DEU__';
  Datamap.prototype.djiTopo = '__DJI__';
  Datamap.prototype.dmaTopo = '__DMA__';
  Datamap.prototype.dnkTopo = '__DNK__';
  Datamap.prototype.domTopo = '__DOM__';
  Datamap.prototype.dzaTopo = '__DZA__';
  Datamap.prototype.ecuTopo = '__ECU__';
  Datamap.prototype.egyTopo = '__EGY__';
  Datamap.prototype.eriTopo = '__ERI__';
  Datamap.prototype.esbTopo = '__ESB__';
  Datamap.prototype.espTopo = '__ESP__';
  Datamap.prototype.estTopo = '__EST__';
  Datamap.prototype.ethTopo = '__ETH__';
  Datamap.prototype.finTopo = '__FIN__';
  Datamap.prototype.fjiTopo = '__FJI__';
  Datamap.prototype.flkTopo = '__FLK__';
  Datamap.prototype.fraTopo = '__FRA__';
  Datamap.prototype.froTopo = '__FRO__';
  Datamap.prototype.fsmTopo = '__FSM__';
  Datamap.prototype.gabTopo = '__GAB__';
  Datamap.prototype.psxTopo = '__PSX__';
  Datamap.prototype.gbrTopo = '__GBR__';
  Datamap.prototype.geoTopo = '__GEO__';
  Datamap.prototype.ggyTopo = '__GGY__';
  Datamap.prototype.ghaTopo = '__GHA__';
  Datamap.prototype.gibTopo = '__GIB__';
  Datamap.prototype.ginTopo = '__GIN__';
  Datamap.prototype.gmbTopo = '__GMB__';
  Datamap.prototype.gnbTopo = '__GNB__';
  Datamap.prototype.gnqTopo = '__GNQ__';
  Datamap.prototype.grcTopo = '__GRC__';
  Datamap.prototype.grdTopo = '__GRD__';
  Datamap.prototype.grlTopo = '__GRL__';
  Datamap.prototype.gtmTopo = '__GTM__';
  Datamap.prototype.gumTopo = '__GUM__';
  Datamap.prototype.guyTopo = '__GUY__';
  Datamap.prototype.hkgTopo = '__HKG__';
  Datamap.prototype.hmdTopo = '__HMD__';
  Datamap.prototype.hndTopo = '__HND__';
  Datamap.prototype.hrvTopo = '__HRV__';
  Datamap.prototype.htiTopo = '__HTI__';
  Datamap.prototype.hunTopo = '__HUN__';
  Datamap.prototype.idnTopo = '__IDN__';
  Datamap.prototype.imnTopo = '__IMN__';
  Datamap.prototype.indTopo = '__IND__';
  Datamap.prototype.ioaTopo = '__IOA__';
  Datamap.prototype.iotTopo = '__IOT__';
  Datamap.prototype.irlTopo = '__IRL__';
  Datamap.prototype.irnTopo = '__IRN__';
  Datamap.prototype.irqTopo = '__IRQ__';
  Datamap.prototype.islTopo = '__ISL__';
  Datamap.prototype.isrTopo = '__ISR__';
  Datamap.prototype.itaTopo = '__ITA__';
  Datamap.prototype.jamTopo = '__JAM__';
  Datamap.prototype.jeyTopo = '__JEY__';
  Datamap.prototype.jorTopo = '__JOR__';
  Datamap.prototype.jpnTopo = '__JPN__';
  Datamap.prototype.kabTopo = '__KAB__';
  Datamap.prototype.kasTopo = '__KAS__';
  Datamap.prototype.kazTopo = '__KAZ__';
  Datamap.prototype.kenTopo = '__KEN__';
  Datamap.prototype.kgzTopo = '__KGZ__';
  Datamap.prototype.khmTopo = '__KHM__';
  Datamap.prototype.kirTopo = '__KIR__';
  Datamap.prototype.knaTopo = '__KNA__';
  Datamap.prototype.korTopo = '__KOR__';
  Datamap.prototype.kosTopo = '__KOS__';
  Datamap.prototype.kwtTopo = '__KWT__';
  Datamap.prototype.laoTopo = '__LAO__';
  Datamap.prototype.lbnTopo = '__LBN__';
  Datamap.prototype.lbrTopo = '__LBR__';
  Datamap.prototype.lbyTopo = '__LBY__';
  Datamap.prototype.lcaTopo = '__LCA__';
  Datamap.prototype.lieTopo = '__LIE__';
  Datamap.prototype.lkaTopo = '__LKA__';
  Datamap.prototype.lsoTopo = '__LSO__';
  Datamap.prototype.ltuTopo = '__LTU__';
  Datamap.prototype.luxTopo = '__LUX__';
  Datamap.prototype.lvaTopo = '__LVA__';
  Datamap.prototype.macTopo = '__MAC__';
  Datamap.prototype.mafTopo = '__MAF__';
  Datamap.prototype.marTopo = '__MAR__';
  Datamap.prototype.mcoTopo = '__MCO__';
  Datamap.prototype.mdaTopo = '__MDA__';
  Datamap.prototype.mdgTopo = '__MDG__';
  Datamap.prototype.mdvTopo = '__MDV__';
  Datamap.prototype.mexTopo = '__MEX__';
  Datamap.prototype.mhlTopo = '__MHL__';
  Datamap.prototype.mkdTopo = '__MKD__';
  Datamap.prototype.mliTopo = '__MLI__';
  Datamap.prototype.mltTopo = '__MLT__';
  Datamap.prototype.mmrTopo = '__MMR__';
  Datamap.prototype.mneTopo = '__MNE__';
  Datamap.prototype.mngTopo = '__MNG__';
  Datamap.prototype.mnpTopo = '__MNP__';
  Datamap.prototype.mozTopo = '__MOZ__';
  Datamap.prototype.mrtTopo = '__MRT__';
  Datamap.prototype.msrTopo = '__MSR__';
  Datamap.prototype.musTopo = '__MUS__';
  Datamap.prototype.mwiTopo = '__MWI__';
  Datamap.prototype.mysTopo = '__MYS__';
  Datamap.prototype.namTopo = '__NAM__';
  Datamap.prototype.nclTopo = '__NCL__';
  Datamap.prototype.nerTopo = '__NER__';
  Datamap.prototype.nfkTopo = '__NFK__';
  Datamap.prototype.ngaTopo = '__NGA__';
  Datamap.prototype.nicTopo = '__NIC__';
  Datamap.prototype.niuTopo = '__NIU__';
  Datamap.prototype.nldTopo = '__NLD__';
  Datamap.prototype.nplTopo = '__NPL__';
  Datamap.prototype.nruTopo = '__NRU__';
  Datamap.prototype.nulTopo = '__NUL__';
  Datamap.prototype.nzlTopo = '__NZL__';
  Datamap.prototype.omnTopo = '__OMN__';
  Datamap.prototype.pakTopo = '__PAK__';
  Datamap.prototype.panTopo = '__PAN__';
  Datamap.prototype.pcnTopo = '__PCN__';
  Datamap.prototype.perTopo = '__PER__';
  Datamap.prototype.pgaTopo = '__PGA__';
  Datamap.prototype.phlTopo = '__PHL__';
  Datamap.prototype.plwTopo = '__PLW__';
  Datamap.prototype.pngTopo = '__PNG__';
  Datamap.prototype.polTopo = '__POL__';
  Datamap.prototype.priTopo = '__PRI__';
  Datamap.prototype.prkTopo = '__PRK__';
  Datamap.prototype.prtTopo = '__PRT__';
  Datamap.prototype.pryTopo = '__PRY__';
  Datamap.prototype.pyfTopo = '__PYF__';
  Datamap.prototype.qatTopo = '__QAT__';
  Datamap.prototype.rouTopo = '__ROU__';
  Datamap.prototype.rusTopo = '__RUS__';
  Datamap.prototype.rwaTopo = '__RWA__';
  Datamap.prototype.sahTopo = '__SAH__';
  Datamap.prototype.sauTopo = '__SAU__';
  Datamap.prototype.scrTopo = '__SCR__';
  Datamap.prototype.sdnTopo = '__SDN__';
  Datamap.prototype.sdsTopo = '__SDS__';
  Datamap.prototype.senTopo = '__SEN__';
  Datamap.prototype.serTopo = '__SER__';
  Datamap.prototype.sgpTopo = '__SGP__';
  Datamap.prototype.sgsTopo = '__SGS__';
  Datamap.prototype.shnTopo = '__SHN__';
  Datamap.prototype.slbTopo = '__SLB__';
  Datamap.prototype.sleTopo = '__SLE__';
  Datamap.prototype.slvTopo = '__SLV__';
  Datamap.prototype.smrTopo = '__SMR__';
  Datamap.prototype.solTopo = '__SOL__';
  Datamap.prototype.somTopo = '__SOM__';
  Datamap.prototype.spmTopo = '__SPM__';
  Datamap.prototype.srbTopo = '__SRB__';
  Datamap.prototype.stpTopo = '__STP__';
  Datamap.prototype.surTopo = '__SUR__';
  Datamap.prototype.svkTopo = '__SVK__';
  Datamap.prototype.svnTopo = '__SVN__';
  Datamap.prototype.sweTopo = '__SWE__';
  Datamap.prototype.swzTopo = '__SWZ__';
  Datamap.prototype.sxmTopo = '__SXM__';
  Datamap.prototype.sycTopo = '__SYC__';
  Datamap.prototype.syrTopo = '__SYR__';
  Datamap.prototype.tcaTopo = '__TCA__';
  Datamap.prototype.tcdTopo = '__TCD__';
  Datamap.prototype.tgoTopo = '__TGO__';
  Datamap.prototype.thaTopo = '__THA__';
  Datamap.prototype.tjkTopo = '__TJK__';
  Datamap.prototype.tkmTopo = '__TKM__';
  Datamap.prototype.tlsTopo = '__TLS__';
  Datamap.prototype.tonTopo = '__TON__';
  Datamap.prototype.ttoTopo = '__TTO__';
  Datamap.prototype.tunTopo = '__TUN__';
  Datamap.prototype.turTopo = '__TUR__';
  Datamap.prototype.tuvTopo = '__TUV__';
  Datamap.prototype.twnTopo = '__TWN__';
  Datamap.prototype.tzaTopo = '__TZA__';
  Datamap.prototype.ugaTopo = '__UGA__';
  Datamap.prototype.ukrTopo = '__UKR__';
  Datamap.prototype.umiTopo = '__UMI__';
  Datamap.prototype.uryTopo = '__URY__';
  Datamap.prototype.usaTopo = '__USA__';
  Datamap.prototype.usgTopo = '__USG__';
  Datamap.prototype.uzbTopo = '__UZB__';
  Datamap.prototype.vatTopo = '__VAT__';
  Datamap.prototype.vctTopo = '__VCT__';
  Datamap.prototype.venTopo = '__VEN__';
  Datamap.prototype.vgbTopo = '__VGB__';
  Datamap.prototype.virTopo = '__VIR__';
  Datamap.prototype.vnmTopo = '__VNM__';
  Datamap.prototype.vutTopo = '__VUT__';
  Datamap.prototype.wlfTopo = '__WLF__';
  Datamap.prototype.wsbTopo = '__WSB__';
  Datamap.prototype.wsmTopo = '__WSM__';
  Datamap.prototype.yemTopo = '__YEM__';
  Datamap.prototype.zafTopo = '__ZAF__';
  Datamap.prototype.zmbTopo = '__ZMB__';
  Datamap.prototype.zweTopo = '__ZWE__';

  /**************************************
                Utilities
  ***************************************/

 // Lookp alpha3 country cdde
 Datamap.prototype.iso3166 = function(id){

    // iso3166-1 (ref: https://en.wikipedia.org/wiki/ISO_3166-1). Extended with EL (Greece) and UK (United Kingdom) as by EU standards
    var iso3166 = [
      {'name': 'Afghanistan', 'alpha2': 'AF', 'alpha3': 'AFG', 'numeric': '004'},
      {'name': 'Åland Islands', 'alpha2': 'AX', 'alpha3': 'ALA', 'numeric': '248'},
      {'name': 'Albania', 'alpha2': 'AL', 'alpha3': 'ALB', 'numeric': '008'},
      {'name': 'Algeria', 'alpha2': 'DZ', 'alpha3': 'DZA', 'numeric': '012'},
      {'name': 'American Samoa', 'alpha2': 'AS', 'alpha3': 'ASM', 'numeric': '016'},
      {'name': 'Andorra', 'alpha2': 'AD', 'alpha3': 'AND', 'numeric': '020'},
      {'name': 'Angola', 'alpha2': 'AO', 'alpha3': 'AGO', 'numeric': '024'},
      {'name': 'Anguilla', 'alpha2': 'AI', 'alpha3': 'AIA', 'numeric': '660'},
      {'name': 'Antarctica', 'alpha2': 'AQ', 'alpha3': 'ATA', 'numeric': '010'},
      {'name': 'Antigua and Barbuda', 'alpha2': 'AG', 'alpha3': 'ATG', 'numeric': '028'},
      {'name': 'Argentina', 'alpha2': 'AR', 'alpha3': 'ARG', 'numeric': '032'},
      {'name': 'Armenia', 'alpha2': 'AM', 'alpha3': 'ARM', 'numeric': '051'},
      {'name': 'Aruba', 'alpha2': 'AW', 'alpha3': 'ABW', 'numeric': '533'},
      {'name': 'Australia', 'alpha2': 'AU', 'alpha3': 'AUS', 'numeric': '036'},
      {'name': 'Austria', 'alpha2': 'AT', 'alpha3': 'AUT', 'numeric': '040'},
      {'name': 'Azerbaijan', 'alpha2': 'AZ', 'alpha3': 'AZE', 'numeric': '031'},
      {'name': 'Bahamas', 'alpha2': 'BS', 'alpha3': 'BHS', 'numeric': '044'},
      {'name': 'Bahrain', 'alpha2': 'BH', 'alpha3': 'BHR', 'numeric': '048'},
      {'name': 'Bangladesh', 'alpha2': 'BD', 'alpha3': 'BGD', 'numeric': '050'},
      {'name': 'Barbados', 'alpha2': 'BB', 'alpha3': 'BRB', 'numeric': '052'},
      {'name': 'Belarus', 'alpha2': 'BY', 'alpha3': 'BLR', 'numeric': '112'},
      {'name': 'Belgium', 'alpha2': 'BE', 'alpha3': 'BEL', 'numeric': '056'},
      {'name': 'Belize', 'alpha2': 'BZ', 'alpha3': 'BLZ', 'numeric': '084'},
      {'name': 'Benin', 'alpha2': 'BJ', 'alpha3': 'BEN', 'numeric': '204'},
      {'name': 'Bermuda', 'alpha2': 'BM', 'alpha3': 'BMU', 'numeric': '060'},
      {'name': 'Bhutan', 'alpha2': 'BT', 'alpha3': 'BTN', 'numeric': '064'},
      {'name': 'Bolivia (Plurinational State of)', 'alpha2': 'BO', 'alpha3': 'BOL', 'numeric': '068'},
      {'name': 'Bonaire, Sint Eustatius and Saba', 'alpha2': 'BQ', 'alpha3': 'BES', 'numeric': '535'},
      {'name': 'Bosnia and Herzegovina', 'alpha2': 'BA', 'alpha3': 'BIH', 'numeric': '070'},
      {'name': 'Botswana', 'alpha2': 'BW', 'alpha3': 'BWA', 'numeric': '072'},
      {'name': 'Bouvet Island', 'alpha2': 'BV', 'alpha3': 'BVT', 'numeric': '074'},
      {'name': 'Brazil', 'alpha2': 'BR', 'alpha3': 'BRA', 'numeric': '076'},
      {'name': 'British Indian Ocean Territory', 'alpha2': 'IO', 'alpha3': 'IOT', 'numeric': '086'},
      {'name': 'Brunei Darussalam', 'alpha2': 'BN', 'alpha3': 'BRN', 'numeric': '096'},
      {'name': 'Bulgaria', 'alpha2': 'BG', 'alpha3': 'BGR', 'numeric': '100'},
      {'name': 'Burkina Faso', 'alpha2': 'BF', 'alpha3': 'BFA', 'numeric': '854'},
      {'name': 'Burundi', 'alpha2': 'BI', 'alpha3': 'BDI', 'numeric': '108'},
      {'name': 'Cabo Verde', 'alpha2': 'CV', 'alpha3': 'CPV', 'numeric': '132'},
      {'name': 'Cambodia', 'alpha2': 'KH', 'alpha3': 'KHM', 'numeric': '116'},
      {'name': 'Cameroon', 'alpha2': 'CM', 'alpha3': 'CMR', 'numeric': '120'},
      {'name': 'Canada', 'alpha2': 'CA', 'alpha3': 'CAN', 'numeric': '124'},
      {'name': 'Cayman Islands', 'alpha2': 'KY', 'alpha3': 'CYM', 'numeric': '136'},
      {'name': 'Central African Republic', 'alpha2': 'CF', 'alpha3': 'CAF', 'numeric': '140'},
      {'name': 'Chad', 'alpha2': 'TD', 'alpha3': 'TCD', 'numeric': '148'},
      {'name': 'Chile', 'alpha2': 'CL', 'alpha3': 'CHL', 'numeric': '152'},
      {'name': 'China', 'alpha2': 'CN', 'alpha3': 'CHN', 'numeric': '156'},
      {'name': 'Christmas Island', 'alpha2': 'CX', 'alpha3': 'CXR', 'numeric': '162'},
      {'name': 'Cocos (Keeling) Islands', 'alpha2': 'CC', 'alpha3': 'CCK', 'numeric': '166'},
      {'name': 'Colombia', 'alpha2': 'CO', 'alpha3': 'COL', 'numeric': '170'},
      {'name': 'Comoros', 'alpha2': 'KM', 'alpha3': 'COM', 'numeric': '174'},
      {'name': 'Congo', 'alpha2': 'CG', 'alpha3': 'COG', 'numeric': '178'},
      {'name': 'Congo (Democratic Republic of the)', 'alpha2': 'CD', 'alpha3': 'COD', 'numeric': '180'},
      {'name': 'Cook Islands', 'alpha2': 'CK', 'alpha3': 'COK', 'numeric': '184'},
      {'name': 'Costa Rica', 'alpha2': 'CR', 'alpha3': 'CRI', 'numeric': '188'},
      {'name': 'Côte d\'Ivoire', 'alpha2': 'CI', 'alpha3': 'CIV', 'numeric': '384'},
      {'name': 'Croatia', 'alpha2': 'HR', 'alpha3': 'HRV', 'numeric': '191'},
      {'name': 'Cuba', 'alpha2': 'CU', 'alpha3': 'CUB', 'numeric': '192'},
      {'name': 'Curaçao', 'alpha2': 'CW', 'alpha3': 'CUW', 'numeric': '531'},
      {'name': 'Cyprus', 'alpha2': 'CY', 'alpha3': 'CYP', 'numeric': '196'},
      {'name': 'Czech Republic', 'alpha2': 'CZ', 'alpha3': 'CZE', 'numeric': '203'},
      {'name': 'Denmark', 'alpha2': 'DK', 'alpha3': 'DNK', 'numeric': '208'},
      {'name': 'Djibouti', 'alpha2': 'DJ', 'alpha3': 'DJI', 'numeric': '262'},
      {'name': 'Dominica', 'alpha2': 'DM', 'alpha3': 'DMA', 'numeric': '212'},
      {'name': 'Dominican Republic', 'alpha2': 'DO', 'alpha3': 'DOM', 'numeric': '214'},
      {'name': 'Ecuador', 'alpha2': 'EC', 'alpha3': 'ECU', 'numeric': '218'},
      {'name': 'Egypt', 'alpha2': 'EG', 'alpha3': 'EGY', 'numeric': '818'},
      {'name': 'El Salvador', 'alpha2': 'SV', 'alpha3': 'SLV', 'numeric': '222'},
      {'name': 'Equatorial Guinea', 'alpha2': 'GQ', 'alpha3': 'GNQ', 'numeric': '226'},
      {'name': 'Eritrea', 'alpha2': 'ER', 'alpha3': 'ERI', 'numeric': '232'},
      {'name': 'Estonia', 'alpha2': 'EE', 'alpha3': 'EST', 'numeric': '233'},
      {'name': 'Ethiopia', 'alpha2': 'ET', 'alpha3': 'ETH', 'numeric': '231'},
      {'name': 'Falkland Islands (Malvinas)', 'alpha2': 'FK', 'alpha3': 'FLK', 'numeric': '238'},
      {'name': 'Faroe Islands', 'alpha2': 'FO', 'alpha3': 'FRO', 'numeric': '234'},
      {'name': 'Fiji', 'alpha2': 'FJ', 'alpha3': 'FJI', 'numeric': '242'},
      {'name': 'Finland', 'alpha2': 'FI', 'alpha3': 'FIN', 'numeric': '246'},
      {'name': 'France', 'alpha2': 'FR', 'alpha3': 'FRA', 'numeric': '250'},
      {'name': 'French Guiana', 'alpha2': 'GF', 'alpha3': 'GUF', 'numeric': '254'},
      {'name': 'French Polynesia', 'alpha2': 'PF', 'alpha3': 'PYF', 'numeric': '258'},
      {'name': 'French Southern Territories', 'alpha2': 'TF', 'alpha3': 'ATF', 'numeric': '260'},
      {'name': 'Gabon', 'alpha2': 'GA', 'alpha3': 'GAB', 'numeric': '266'},
      {'name': 'Gambia', 'alpha2': 'GM', 'alpha3': 'GMB', 'numeric': '270'},
      {'name': 'Georgia', 'alpha2': 'GE', 'alpha3': 'GEO', 'numeric': '268'},
      {'name': 'Germany', 'alpha2': 'DE', 'alpha3': 'DEU', 'numeric': '276'},
      {'name': 'Ghana', 'alpha2': 'GH', 'alpha3': 'GHA', 'numeric': '288'},
      {'name': 'Gibraltar', 'alpha2': 'GI', 'alpha3': 'GIB', 'numeric': '292'},
      {'name': 'Greece', 'alpha2': 'GR', 'alpha3': 'GRC', 'numeric': '300'},
      {'name': 'Greece', 'alpha2': 'EL', 'alpha3': 'GRC', 'numeric': '300'},
      {'name': 'Greenland', 'alpha2': 'GL', 'alpha3': 'GRL', 'numeric': '304'},
      {'name': 'Grenada', 'alpha2': 'GD', 'alpha3': 'GRD', 'numeric': '308'},
      {'name': 'Guadeloupe', 'alpha2': 'GP', 'alpha3': 'GLP', 'numeric': '312'},
      {'name': 'Guam', 'alpha2': 'GU', 'alpha3': 'GUM', 'numeric': '316'},
      {'name': 'Guatemala', 'alpha2': 'GT', 'alpha3': 'GTM', 'numeric': '320'},
      {'name': 'Guernsey', 'alpha2': 'GG', 'alpha3': 'GGY', 'numeric': '831'},
      {'name': 'Guinea', 'alpha2': 'GN', 'alpha3': 'GIN', 'numeric': '324'},
      {'name': 'Guinea-Bissau', 'alpha2': 'GW', 'alpha3': 'GNB', 'numeric': '624'},
      {'name': 'Guyana', 'alpha2': 'GY', 'alpha3': 'GUY', 'numeric': '328'},
      {'name': 'Haiti', 'alpha2': 'HT', 'alpha3': 'HTI', 'numeric': '332'},
      {'name': 'Heard Island and McDonald Islands', 'alpha2': 'HM', 'alpha3': 'HMD', 'numeric': '334'},
      {'name': 'Holy See', 'alpha2': 'VA', 'alpha3': 'VAT', 'numeric': '336'},
      {'name': 'Honduras', 'alpha2': 'HN', 'alpha3': 'HND', 'numeric': '340'},
      {'name': 'Hong Kong', 'alpha2': 'HK', 'alpha3': 'HKG', 'numeric': '344'},
      {'name': 'Hungary', 'alpha2': 'HU', 'alpha3': 'HUN', 'numeric': '348'},
      {'name': 'Iceland', 'alpha2': 'IS', 'alpha3': 'ISL', 'numeric': '352'},
      {'name': 'India', 'alpha2': 'IN', 'alpha3': 'IND', 'numeric': '356'},
      {'name': 'Indonesia', 'alpha2': 'ID', 'alpha3': 'IDN', 'numeric': '360'},
      {'name': 'Iran (Islamic Republic of)', 'alpha2': 'IR', 'alpha3': 'IRN', 'numeric': '364'},
      {'name': 'Iraq', 'alpha2': 'IQ', 'alpha3': 'IRQ', 'numeric': '368'},
      {'name': 'Ireland', 'alpha2': 'IE', 'alpha3': 'IRL', 'numeric': '372'},
      {'name': 'Isle of Man', 'alpha2': 'IM', 'alpha3': 'IMN', 'numeric': '833'},
      {'name': 'Israel', 'alpha2': 'IL', 'alpha3': 'ISR', 'numeric': '376'},
      {'name': 'Italy', 'alpha2': 'IT', 'alpha3': 'ITA', 'numeric': '380'},
      {'name': 'Jamaica', 'alpha2': 'JM', 'alpha3': 'JAM', 'numeric': '388'},
      {'name': 'Japan', 'alpha2': 'JP', 'alpha3': 'JPN', 'numeric': '392'},
      {'name': 'Jersey', 'alpha2': 'JE', 'alpha3': 'JEY', 'numeric': '832'},
      {'name': 'Jordan', 'alpha2': 'JO', 'alpha3': 'JOR', 'numeric': '400'},
      {'name': 'Kazakhstan', 'alpha2': 'KZ', 'alpha3': 'KAZ', 'numeric': '398'},
      {'name': 'Kenya', 'alpha2': 'KE', 'alpha3': 'KEN', 'numeric': '404'},
      {'name': 'Kiribati', 'alpha2': 'KI', 'alpha3': 'KIR', 'numeric': '296'},
      {'name': 'Korea (Democratic People\'s Republic of)', 'alpha2': 'KP', 'alpha3': 'PRK', 'numeric': '408'},
      {'name': 'Korea (Republic of)', 'alpha2': 'KR', 'alpha3': 'KOR', 'numeric': '410'},
      {'name': 'Kuwait', 'alpha2': 'KW', 'alpha3': 'KWT', 'numeric': '414'},
      {'name': 'Kyrgyzstan', 'alpha2': 'KG', 'alpha3': 'KGZ', 'numeric': '417'},
      {'name': 'Lao People\'s Democratic Republic', 'alpha2': 'LA', 'alpha3': 'LAO', 'numeric': '418'},
      {'name': 'Latvia', 'alpha2': 'LV', 'alpha3': 'LVA', 'numeric': '428'},
      {'name': 'Lebanon', 'alpha2': 'LB', 'alpha3': 'LBN', 'numeric': '422'},
      {'name': 'Lesotho', 'alpha2': 'LS', 'alpha3': 'LSO', 'numeric': '426'},
      {'name': 'Liberia', 'alpha2': 'LR', 'alpha3': 'LBR', 'numeric': '430'},
      {'name': 'Libya', 'alpha2': 'LY', 'alpha3': 'LBY', 'numeric': '434'},
      {'name': 'Liechtenstein', 'alpha2': 'LI', 'alpha3': 'LIE', 'numeric': '438'},
      {'name': 'Lithuania', 'alpha2': 'LT', 'alpha3': 'LTU', 'numeric': '440'},
      {'name': 'Luxembourg', 'alpha2': 'LU', 'alpha3': 'LUX', 'numeric': '442'},
      {'name': 'Macao', 'alpha2': 'MO', 'alpha3': 'MAC', 'numeric': '446'},
      {'name': 'Macedonia (the former Yugoslav Republic of)', 'alpha2': 'MK', 'alpha3': 'MKD', 'numeric': '807'},
      {'name': 'Madagascar', 'alpha2': 'MG', 'alpha3': 'MDG', 'numeric': '450'},
      {'name': 'Malawi', 'alpha2': 'MW', 'alpha3': 'MWI', 'numeric': '454'},
      {'name': 'Malaysia', 'alpha2': 'MY', 'alpha3': 'MYS', 'numeric': '458'},
      {'name': 'Maldives', 'alpha2': 'MV', 'alpha3': 'MDV', 'numeric': '462'},
      {'name': 'Mali', 'alpha2': 'ML', 'alpha3': 'MLI', 'numeric': '466'},
      {'name': 'Malta', 'alpha2': 'MT', 'alpha3': 'MLT', 'numeric': '470'},
      {'name': 'Marshall Islands', 'alpha2': 'MH', 'alpha3': 'MHL', 'numeric': '584'},
      {'name': 'Martinique', 'alpha2': 'MQ', 'alpha3': 'MTQ', 'numeric': '474'},
      {'name': 'Mauritania', 'alpha2': 'MR', 'alpha3': 'MRT', 'numeric': '478'},
      {'name': 'Mauritius', 'alpha2': 'MU', 'alpha3': 'MUS', 'numeric': '480'},
      {'name': 'Mayotte', 'alpha2': 'YT', 'alpha3': 'MYT', 'numeric': '175'},
      {'name': 'Mexico', 'alpha2': 'MX', 'alpha3': 'MEX', 'numeric': '484'},
      {'name': 'Micronesia (Federated States of)', 'alpha2': 'FM', 'alpha3': 'FSM', 'numeric': '583'},
      {'name': 'Moldova (Republic of)', 'alpha2': 'MD', 'alpha3': 'MDA', 'numeric': '498'},
      {'name': 'Monaco', 'alpha2': 'MC', 'alpha3': 'MCO', 'numeric': '492'},
      {'name': 'Mongolia', 'alpha2': 'MN', 'alpha3': 'MNG', 'numeric': '496'},
      {'name': 'Montenegro', 'alpha2': 'ME', 'alpha3': 'MNE', 'numeric': '499'},
      {'name': 'Montserrat', 'alpha2': 'MS', 'alpha3': 'MSR', 'numeric': '500'},
      {'name': 'Morocco', 'alpha2': 'MA', 'alpha3': 'MAR', 'numeric': '504'},
      {'name': 'Mozambique', 'alpha2': 'MZ', 'alpha3': 'MOZ', 'numeric': '508'},
      {'name': 'Myanmar', 'alpha2': 'MM', 'alpha3': 'MMR', 'numeric': '104'},
      {'name': 'Namibia', 'alpha2': 'NA', 'alpha3': 'NAM', 'numeric': '516'},
      {'name': 'Nauru', 'alpha2': 'NR', 'alpha3': 'NRU', 'numeric': '520'},
      {'name': 'Nepal', 'alpha2': 'NP', 'alpha3': 'NPL', 'numeric': '524'},
      {'name': 'Netherlands', 'alpha2': 'NL', 'alpha3': 'NLD', 'numeric': '528'},
      {'name': 'New Caledonia', 'alpha2': 'NC', 'alpha3': 'NCL', 'numeric': '540'},
      {'name': 'New Zealand', 'alpha2': 'NZ', 'alpha3': 'NZL', 'numeric': '554'},
      {'name': 'Nicaragua', 'alpha2': 'NI', 'alpha3': 'NIC', 'numeric': '558'},
      {'name': 'Niger', 'alpha2': 'NE', 'alpha3': 'NER', 'numeric': '562'},
      {'name': 'Nigeria', 'alpha2': 'NG', 'alpha3': 'NGA', 'numeric': '566'},
      {'name': 'Niue', 'alpha2': 'NU', 'alpha3': 'NIU', 'numeric': '570'},
      {'name': 'Norfolk Island', 'alpha2': 'NF', 'alpha3': 'NFK', 'numeric': '574'},
      {'name': 'Northern Mariana Islands', 'alpha2': 'MP', 'alpha3': 'MNP', 'numeric': '580'},
      {'name': 'Norway', 'alpha2': 'NO', 'alpha3': 'NOR', 'numeric': '578'},
      {'name': 'Oman', 'alpha2': 'OM', 'alpha3': 'OMN', 'numeric': '512'},
      {'name': 'Pakistan', 'alpha2': 'PK', 'alpha3': 'PAK', 'numeric': '586'},
      {'name': 'Palau', 'alpha2': 'PW', 'alpha3': 'PLW', 'numeric': '585'},
      {'name': 'Palestine, State of', 'alpha2': 'PS', 'alpha3': 'PSE', 'numeric': '275'},
      {'name': 'Panama', 'alpha2': 'PA', 'alpha3': 'PAN', 'numeric': '591'},
      {'name': 'Papua New Guinea', 'alpha2': 'PG', 'alpha3': 'PNG', 'numeric': '598'},
      {'name': 'Paraguay', 'alpha2': 'PY', 'alpha3': 'PRY', 'numeric': '600'},
      {'name': 'Peru', 'alpha2': 'PE', 'alpha3': 'PER', 'numeric': '604'},
      {'name': 'Philippines', 'alpha2': 'PH', 'alpha3': 'PHL', 'numeric': '608'},
      {'name': 'Pitcairn', 'alpha2': 'PN', 'alpha3': 'PCN', 'numeric': '612'},
      {'name': 'Poland', 'alpha2': 'PL', 'alpha3': 'POL', 'numeric': '616'},
      {'name': 'Portugal', 'alpha2': 'PT', 'alpha3': 'PRT', 'numeric': '620'},
      {'name': 'Puerto Rico', 'alpha2': 'PR', 'alpha3': 'PRI', 'numeric': '630'},
      {'name': 'Qatar', 'alpha2': 'QA', 'alpha3': 'QAT', 'numeric': '634'},
      {'name': 'Réunion', 'alpha2': 'RE', 'alpha3': 'REU', 'numeric': '638'},
      {'name': 'Romania', 'alpha2': 'RO', 'alpha3': 'ROU', 'numeric': '642'},
      {'name': 'Russian Federation', 'alpha2': 'RU', 'alpha3': 'RUS', 'numeric': '643'},
      {'name': 'Rwanda', 'alpha2': 'RW', 'alpha3': 'RWA', 'numeric': '646'},
      {'name': 'Saint Barthélemy', 'alpha2': 'BL', 'alpha3': 'BLM', 'numeric': '652'},
      {'name': 'Saint Helena, Ascension and Tristan da Cunha', 'alpha2': 'SH', 'alpha3': 'SHN', 'numeric': '654'},
      {'name': 'Saint Kitts and Nevis', 'alpha2': 'KN', 'alpha3': 'KNA', 'numeric': '659'},
      {'name': 'Saint Lucia', 'alpha2': 'LC', 'alpha3': 'LCA', 'numeric': '662'},
      {'name': 'Saint Martin (French part)', 'alpha2': 'MF', 'alpha3': 'MAF', 'numeric': '663'},
      {'name': 'Saint Pierre and Miquelon', 'alpha2': 'PM', 'alpha3': 'SPM', 'numeric': '666'},
      {'name': 'Saint Vincent and the Grenadines', 'alpha2': 'VC', 'alpha3': 'VCT', 'numeric': '670'},
      {'name': 'Samoa', 'alpha2': 'WS', 'alpha3': 'WSM', 'numeric': '882'},
      {'name': 'San Marino', 'alpha2': 'SM', 'alpha3': 'SMR', 'numeric': '674'},
      {'name': 'Sao Tome and Principe', 'alpha2': 'ST', 'alpha3': 'STP', 'numeric': '678'},
      {'name': 'Saudi Arabia', 'alpha2': 'SA', 'alpha3': 'SAU', 'numeric': '682'},
      {'name': 'Senegal', 'alpha2': 'SN', 'alpha3': 'SEN', 'numeric': '686'},
      {'name': 'Serbia', 'alpha2': 'RS', 'alpha3': 'SRB', 'numeric': '688'},
      {'name': 'Seychelles', 'alpha2': 'SC', 'alpha3': 'SYC', 'numeric': '690'},
      {'name': 'Sierra Leone', 'alpha2': 'SL', 'alpha3': 'SLE', 'numeric': '694'},
      {'name': 'Singapore', 'alpha2': 'SG', 'alpha3': 'SGP', 'numeric': '702'},
      {'name': 'Sint Maarten (Dutch part)', 'alpha2': 'SX', 'alpha3': 'SXM', 'numeric': '534'},
      {'name': 'Slovakia', 'alpha2': 'SK', 'alpha3': 'SVK', 'numeric': '703'},
      {'name': 'Slovenia', 'alpha2': 'SI', 'alpha3': 'SVN', 'numeric': '705'},
      {'name': 'Solomon Islands', 'alpha2': 'SB', 'alpha3': 'SLB', 'numeric': '090'},
      {'name': 'Somalia', 'alpha2': 'SO', 'alpha3': 'SOM', 'numeric': '706'},
      {'name': 'South Africa', 'alpha2': 'ZA', 'alpha3': 'ZAF', 'numeric': '710'},
      {'name': 'South Georgia and the South Sandwich Islands', 'alpha2': 'GS', 'alpha3': 'SGS', 'numeric': '239'},
      {'name': 'South Sudan', 'alpha2': 'SS', 'alpha3': 'SSD', 'numeric': '728'},
      {'name': 'Spain', 'alpha2': 'ES', 'alpha3': 'ESP', 'numeric': '724'},
      {'name': 'Sri Lanka', 'alpha2': 'LK', 'alpha3': 'LKA', 'numeric': '144'},
      {'name': 'Sudan', 'alpha2': 'SD', 'alpha3': 'SDN', 'numeric': '729'},
      {'name': 'Suriname', 'alpha2': 'SR', 'alpha3': 'SUR', 'numeric': '740'},
      {'name': 'Svalbard and Jan Mayen', 'alpha2': 'SJ', 'alpha3': 'SJM', 'numeric': '744'},
      {'name': 'Swaziland', 'alpha2': 'SZ', 'alpha3': 'SWZ', 'numeric': '748'},
      {'name': 'Sweden', 'alpha2': 'SE', 'alpha3': 'SWE', 'numeric': '752'},
      {'name': 'Switzerland', 'alpha2': 'CH', 'alpha3': 'CHE', 'numeric': '756'},
      {'name': 'Syrian Arab Republic', 'alpha2': 'SY', 'alpha3': 'SYR', 'numeric': '760'},
      {'name': 'Taiwan, Province of China[a]', 'alpha2': 'TW', 'alpha3': 'TWN', 'numeric': '158'},
      {'name': 'Tajikistan', 'alpha2': 'TJ', 'alpha3': 'TJK', 'numeric': '762'},
      {'name': 'Tanzania, United Republic of', 'alpha2': 'TZ', 'alpha3': 'TZA', 'numeric': '834'},
      {'name': 'Thailand', 'alpha2': 'TH', 'alpha3': 'THA', 'numeric': '764'},
      {'name': 'Timor-Leste', 'alpha2': 'TL', 'alpha3': 'TLS', 'numeric': '626'},
      {'name': 'Togo', 'alpha2': 'TG', 'alpha3': 'TGO', 'numeric': '768'},
      {'name': 'Tokelau', 'alpha2': 'TK', 'alpha3': 'TKL', 'numeric': '772'},
      {'name': 'Tonga', 'alpha2': 'TO', 'alpha3': 'TON', 'numeric': '776'},
      {'name': 'Trinidad and Tobago', 'alpha2': 'TT', 'alpha3': 'TTO', 'numeric': '780'},
      {'name': 'Tunisia', 'alpha2': 'TN', 'alpha3': 'TUN', 'numeric': '788'},
      {'name': 'Turkey', 'alpha2': 'TR', 'alpha3': 'TUR', 'numeric': '792'},
      {'name': 'Turkmenistan', 'alpha2': 'TM', 'alpha3': 'TKM', 'numeric': '795'},
      {'name': 'Turks and Caicos Islands', 'alpha2': 'TC', 'alpha3': 'TCA', 'numeric': '796'},
      {'name': 'Tuvalu', 'alpha2': 'TV', 'alpha3': 'TUV', 'numeric': '798'},
      {'name': 'Uganda', 'alpha2': 'UG', 'alpha3': 'UGA', 'numeric': '800'},
      {'name': 'Ukraine', 'alpha2': 'UA', 'alpha3': 'UKR', 'numeric': '804'},
      {'name': 'United Arab Emirates', 'alpha2': 'AE', 'alpha3': 'ARE', 'numeric': '784'},
      {'name': 'United Kingdom of Great Britain and Northern Ireland', 'alpha2': 'GB', 'alpha3': 'GBR', 'numeric': '826'},
      {'name': 'United Kingdom of Great Britain and Northern Ireland', 'alpha2': 'UK', 'alpha3': 'GBR', 'numeric': '826'},
      {'name': 'United States of America', 'alpha2': 'US', 'alpha3': 'USA', 'numeric': '840'},
      {'name': 'United States Minor Outlying Islands', 'alpha2': 'UM', 'alpha3': 'UMI', 'numeric': '581'},
      {'name': 'Uruguay', 'alpha2': 'UY', 'alpha3': 'URY', 'numeric': '858'},
      {'name': 'Uzbekistan', 'alpha2': 'UZ', 'alpha3': 'UZB', 'numeric': '860'},
      {'name': 'Vanuatu', 'alpha2': 'VU', 'alpha3': 'VUT', 'numeric': '548'},
      {'name': 'Venezuela (Bolivarian Republic of)', 'alpha2': 'VE', 'alpha3': 'VEN', 'numeric': '862'},
      {'name': 'Viet Nam', 'alpha2': 'VN', 'alpha3': 'VNM', 'numeric': '704'},
      {'name': 'Virgin Islands (British)', 'alpha2': 'VG', 'alpha3': 'VGB', 'numeric': '092'},
      {'name': 'Virgin Islands (U.S.)', 'alpha2': 'VI', 'alpha3': 'VIR', 'numeric': '850'},
      {'name': 'Wallis and Futuna', 'alpha2': 'WF', 'alpha3': 'WLF', 'numeric': '876'},
      {'name': 'Western Sahara', 'alpha2': 'EH', 'alpha3': 'ESH', 'numeric': '732'},
      {'name': 'Yemen', 'alpha2': 'YE', 'alpha3': 'YEM', 'numeric': '887'},
      {'name': 'Zambia', 'alpha2': 'ZM', 'alpha3': 'ZMB', 'numeric': '894'},
      {'name': 'Zimbabwe', 'alpha2': 'ZW', 'alpha3': 'ZWE', 'numeric': '716'}
    ];

    if (/[A-Z]{3}/.test(id)) {
      return id;
    }

    if (/[A-Z]{2}/.test(id)) {
      return iso3166.filter(function (c) {
        return c.alpha2 === id;
      })[0].alpha3;
    }

    if (/\d{3}/.test(id)) {
      return iso3166.filter(function (c) {
        return c.numeric === id;
      })[0].alpha3;
    }

    // TODO: name -> alpha3

    return false;
  };

  // Convert lat/lng coords to X / Y coords
  Datamap.prototype.latLngToXY = function(lat, lng) {
     return this.projection([lng, lat]);
  };


  /**
   * [getXY description]
   * @param  {[type]} d [description]
   * @return {[type]}       [description]
   */
  Datamap.prototype.getXY = function(datum) {

    var latLng = [0,0];

    if ( typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined' ) {
      latLng = this.latLngToXY(datum.latitude, datum.longitude);
    }
    else if ( typeof datum !== 'undefined' && typeof datum.centered !== 'undefined') {
      var centered = this.iso3166(datum.centered);
      switch (centered) {
        case  "USA":
          latLng = this.latLngToXY(-98.58333, 39.83333);
          break;
        case "CAN":
          latLng = this.latLngToXY(56.624472, -114.665293);
          break;
        case "JPN":
          latLng = this.latLngToXY(35.689487, 139.691706);
          break;
        case "CHL":
          latLng = this.latLngToXY(-33.448890, -70.669265);
          break;
        case "IDN":
          latLng = this.latLngToXY(-6.208763, 106.845599);
          break;
        case "MYS":
          latLng = this.latLngToXY(14.599512, 120.984219);
          break;
        case "NOR":
          latLng = this.latLngToXY(60.054542, 7.542494);
          break;
        default:
          latLng = this.path.centroid(this.svg.select('path.' + centered).data()[0]);
      }
    } else {
      console.log('Oops, can\'t set an XY position...');
    }

    return latLng;

  };

  // Add <g> layer to root SVG
  Datamap.prototype.addLayer = function( className, id, first ) {
    var layer;
    if ( first ) {
      layer = this.svg.insert('g', ':first-child');
    }
    else {
      layer = this.svg.append('g');
    }
    return layer.attr('id', id || '')
      .attr('class', className || '');
  };

  Datamap.prototype.updateChoropleth = function(data, options) {
    var svg = this.svg;
    var that = this;

    // When options.reset = true, reset all the fill colors to the defaultFill and kill all data-info
    if ( options && options.reset === true ) {
      svg.selectAll('.datamaps-subunit')
        .attr('data-info', function() {
           return "{}";
        })
        .transition().style('fill', this.options.fills.defaultFill);
    }

    for ( var subunit in data ) {
      if ( data.hasOwnProperty(subunit) ) {
        var color;
        var subunitData = data[subunit];
        if ( ! subunit ) {
          continue;
        }
        else if ( typeof subunitData === "string" ) {
          color = subunitData;
        }
        else if ( typeof subunitData.color === "string" ) {
          color = subunitData.color;
        }
        else if ( typeof subunitData.fillColor === "string" ) {
          color = subunitData.fillColor;
        }
        else {
          color = this.options.fills[ subunitData.fillKey ];
        }
        // If it's an object, overriding the previous data
        if ( subunitData === Object(subunitData) ) {
          this.options.data[subunit] = defaults(subunitData, this.options.data[subunit] || {});
          var geo = this.svg.select('.' + subunit).attr('data-info', JSON.stringify(this.options.data[subunit]));
        }
        svg
          .selectAll('.' + subunit)
          .transition()
            .style('fill', color);
      }
    }
  };

  Datamap.prototype.updatePopup = function (element, d, options) {
    var self = this;
    element.on('mousemove', null);
    element.on('mousemove', function() {
      var position = d3.mouse(self.options.element);
      d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover')
        .style('top', ( (position[1] + 30)) + "px")
        .html(function() {
          var data = JSON.parse(element.attr('data-info'));
          try {
            return options.popupTemplate(d, data);
          } catch (e) {
            return "";
          }
        })
        .style('left', ( position[0]) + "px");
    });

    d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover').style('display', 'block');
  };

  Datamap.prototype.addPlugin = function( name, pluginFn ) {
    var self = this;
    if ( typeof Datamap.prototype[name] === "undefined" ) {
      Datamap.prototype[name] = function(data, options, callback, createNewLayer) {
        var layer;
        if ( typeof createNewLayer === "undefined" ) {
          createNewLayer = false;
        }

        if ( typeof options === 'function' ) {
          callback = options;
          options = undefined;
        }

        options = defaults(options || {}, self.options[name + 'Config']);

        // Add a single layer, reuse the old layer
        if ( !createNewLayer && this.options[name + 'Layer'] ) {
          layer = this.options[name + 'Layer'];
          options = options || this.options[name + 'Options'];
        }
        else {
          layer = this.addLayer(name);
          this.options[name + 'Layer'] = layer;
          this.options[name + 'Options'] = options;
        }
        pluginFn.apply(this, [layer, data, options]);
        if ( callback ) {
          callback(layer);
        }
      };
    }
  };

  // Expose library
  if (typeof exports === 'object') {
    d3 = require('d3');
    topojson = require('topojson');
    module.exports = Datamap;
  }
  else if ( typeof define === "function" && define.amd ) {
    define( "datamaps", ["require", "d3", "topojson"], function(require) {
      d3 = require('d3');
      topojson = require('topojson');

      return Datamap;
    });
  }
  else {
    window.Datamap = window.Datamaps = Datamap;
  }

  if ( window.jQuery ) {
    window.jQuery.fn.datamaps = function(options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if ( typeof callback === "function" ) {
        callback(datamap, options);
      }
      return this;
    };
  }
})();
