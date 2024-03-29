define([
    'underscore',
    'backbone',
    'openlayers',
    'config',
    'modules/layer/list',
    // 'collections/TreeList',
    'eventbus'
    ], function (_, Backbone, ol, Config, LayerList, EventBus) {

        var DOTS_PER_INCH = $('#dpidiv').outerWidth(); // Hack um die Bildschirmauflösung zu bekommen
        $('#dpidiv').remove();
        //    var POINTS_PER_INCH = 72; //PostScript points 1/72"  --> = dpi nicht ppi
        var MM_PER_INCHES = 25.4;

        /**
        * @exports Map
        * @requires LayerList
        * @classdesc hier beschreiben wir das modul
        */
        var Map = Backbone.Model.extend(
        {
            /**
            *
            */
            initialize: function () {
            	// Auswerten der Config.view.extent und evtl. ausgeben eines Standardextents
				var viewExtent = new Array();
			    if (_.isArray(Config.view.extent) && Config.view.extent.length === 4) {
					viewExtent = Config.view.extent;
				}
				else {
					viewExtent = [510000.0, 5850000.0, 625000.4, 6000000.0];
				}
                // Auswerten der Config.view.resolutions
                var viewResolutions = new Array();
                if (_.isArray(Config.view.resolutions)) {
					viewResolutions = Config.view.resolutions;
				}
				else {
					viewResolutions = [66.14579761460263, 26.458319045841044, 15.874991427504629, 10.583327618336419, 5.2916638091682096, 2.6458319045841048, 1.3229159522920524, 0.6614579761460262, 0.2645831904584105, 0.13229159522920525];
				}

                // Definition der Projektion EPSG:25832
                ol.proj.addProjection(new ol.proj.Projection({
                    code: 'EPSG:25832',
                    units: 'm',
                    extent: viewExtent,
                    axisOrientation: 'enu', // default
                    global: false  // default
                }));

                EventBus.on('activateClick', this.activateClick, this);
                EventBus.on('addLayer', this.addLayer, this);
                EventBus.on('removeLayer', this.removeLayer, this);
                EventBus.on('addOverlay', this.addOverlay, this);
                EventBus.on('removeOverlay', this.removeOverlay, this);
                EventBus.on('addControl', this.addControl, this);
                EventBus.on('removeControl', this.removeControl, this);
                EventBus.on("addInteraction", this.addInteraction, this);
                EventBus.on("removeInteraction", this.removeInteraction, this);
                EventBus.on('moveLayer', this.moveLayer, this);
                EventBus.on('addLayerToIndex', this.addLayerToIndex, this);
                EventBus.on('setCenter', this.setCenter, this);
                EventBus.on('zoomToExtent', this.zoomToExtent, this);
                EventBus.on('setZoomLevelUp', this.setZoomLevelUp, this);
                EventBus.on('setZoomLevelDown', this.setZoomLevelDown, this);
                EventBus.on('updatePrintPage', this.updatePrintPage, this);
                EventBus.on('getMap', this.getMap, this); // getriggert aus MouseHoverPopup
                EventBus.on('initWfsFeatureFilter', this.initWfsFeatureFilter, this);
                EventBus.on('setMeasurePopup', this.setMeasurePopup, this); //warte auf Fertigstellung des MeasurePopup für Übergabe

                this.set('projection', ol.proj.get('EPSG:25832'));

                this.set('view', new ol.View({
                    projection: this.get('projection'),
                    center: Config.view.center,
                    extent: viewExtent,
                    resolution: Config.view.resolution,
                    resolutions : viewResolutions
                }));

                this.set('map', new ol.Map({
                    // layers: LayerList.pluck('layer'),
                    // layers: [],
                    logo: null,
                    renderer: 'canvas',    // 'dom', 'webgl' oder 'canvas'
                    target: 'map',
                    view: this.get('view'),
                    controls: [],
                    interactions: ol.interaction.defaults({altShiftDragRotate:false, pinchRotate:false})
                }));

                // Wenn Touchable, dann implementieren eines Touchevents. Für iPhone nicht nötig, aber auf Android.
				if (ol.has.TOUCH && navigator.userAgent.toLowerCase().indexOf('android') != -1) {
					var startx = 0;
					var starty = 0;
					this.get('map').getViewport().addEventListener('touchstart', function(e){
						var touchobj = e.changedTouches[0]; // reference first touch point (ie: first finger)
						startx = parseInt(touchobj.clientX); // get x position of touch point relative to left edge of browser
						e.preventDefault();
					}, false);
					this.get('map').getViewport().addEventListener('touchend', function(e){
						var touchobj = e.changedTouches[0]; // reference first touch point (ie: first finger)
						// Calculate if there was "significant" movement of the finger
						var movementX = Math.abs(startx-touchobj.clientX);
						var movementY = Math.abs(starty-touchobj.clientY);
						if(movementX < 5 || movementY < 5) {
							var x = _.values(_.pick(touchobj, 'pageX'))[0];
							var y = _.values(_.pick(touchobj, 'pageY'))[0];
							var coordinates = this.get('map').getCoordinateFromPixel([x,y]);
                            // TODO: nicht nur GFIParams setzen sondern auch messen implementieren
							this.setGFIParams({coordinate: coordinates});
						}
						//e.preventDefault(); //verhindert das weitere ausführen von Events. Wird z.B. zum schließen des GFI-Popup aber benötigt.
					}.bind(this),false);
				}

                // Dieses Attribut brauche ich wirklich für die ScaleLine
                this.get('map').DOTS_PER_INCH = DOTS_PER_INCH;
                // für den Layerbaum (FHH-Atlas)
                // switch (Config.tree.orderBy) {
                if (_.has(Config, "tree")) {
                    // _.each(TreeList.pluck("sortedLayerList").reverse(), function (layer) {
                    //     _.each(layer, function (element) {
                    //         this.get("map").addLayer(element.get("layer"));
                    //     }, this);
                    // },this);
                }
                else {
                    _.each(LayerList.pluck("layer"), function (layer) {
                        this.get("map").addLayer(layer);
                    }, this);
                }

                // View listener
                this.get('view').on('change:resolution', function () {
                    EventBus.trigger("currentResolution", this.get('view').getResolution());
                    EventBus.trigger('currentMapScale', Math.round(this.getCurrentScale()));
                },this);
                this.get('view').on('change:center', function () {
                    EventBus.trigger('currentMapCenter', this.get('view').getCenter());
                },this);
            },

            GFIPopupVisibility: function(value) {
                if (value === true) {
                    this.set('GFIPopupVisibility', true);
                }
                else {
                    this.set('GFIPopupVisibility', false);
                }
            },

            initWfsFeatureFilter: function () {
                EventBus.trigger('checkwfsfeaturefilter', this.get('map'));
            },

            getMap: function () {
                EventBus.trigger('setMap', this.get('map'));
            },

            getCurrentScale: function () // wird in GFI Popup verwendet.
        {
            var resolution = this.get('view').getResolution();
            var units = this.get('view').getProjection().getUnits();
            //            var dpi = 25.4 / 0.28;
            var dpi = DOTS_PER_INCH;
            var mpu = ol.proj.METERS_PER_UNIT[units];
            var scale = resolution * mpu * 39.37 * dpi;
            return scale;
        },
        activateClick: function (tool) {
            if (tool === 'coords') {
                this.get('map').un('click', this.setGFIParams, this);
                this.get('map').on('click', this.setPositionCoordPopup);
                this.get("map").un("pointermove", this.pointerMoveOnMap);
            }
            else if (tool === 'gfi') {
                this.get('map').un('click', this.setPositionCoordPopup);
                this.get('map').on('click', this.setGFIParams, this);
                this.get("map").un("pointermove", this.pointerMoveOnMap);
            }
            else if (tool === 'measure') {
                this.get('map').un('click', this.setPositionCoordPopup);
                this.get('map').un('click', this.setGFIParams, this);
                this.get("map").on("pointermove", this.pointerMoveOnMap);
            }
            else if (tool === "draw") {
                this.get("map").un("click", this.setPositionCoordPopup);
                this.get("map").un("click", this.setGFIParams, this);
                this.get("map").un("pointermove", this.pointerMoveOnMap);
            }
        },
        pointerMoveOnMap: function (evt) {
            EventBus.trigger("pointerMoveOnMap", evt)
        },
        /**
        * Interaction-Handling
        */
        addInteraction: function (interaction) {
            this.get("map").addInteraction(interaction);
        },
        removeInteraction: function (interaction) {
            this.get("map").removeInteraction(interaction);
        },
        /**
        * Overlay-Handling
        */
        addOverlay: function (overlay) {
            this.get('map').addOverlay(overlay);
        },
        /**
        */
        removeOverlay: function (overlay) {
            this.get('map').removeOverlay(overlay);
        },
        /**
        * Control-Handling
        */
        addControl: function (control) {
            this.get('map').addControl(control);
        },
        removeControl: function (control) {
            this.get('map').removeControl(control);
        },
        /**
        * Layer-Handling
        */
        addLayer: function (layer) {
            var layerList,
                firstVectorLayer,
                index;

            // Alle Layer
            layerList = this.get("map").getLayers().getArray();
            // der erste Vectorlayer in der Liste
            firstVectorLayer = _.find(layerList, function (layer) {
                return layer instanceof ol.layer.Vector;
            });
            // Index vom ersten VectorLayer in der Layerlist
            index = _.indexOf(layerList, firstVectorLayer);
            if (index !== -1) {
                // Füge den Layer vor dem ersten Vectorlayer hinzu. --> damit bleiben die Vectorlayer(Messen, Zeichnen,...) immer oben auf der Karte
                this.get("map").getLayers().insertAt(index, layer);
            }
            else {
                this.get("map").getLayers().push(layer);
            }
        },
        /**
        */
        removeLayer: function (layer) {
            this.get('map').removeLayer(layer);
            layers = this.get('map').getLayers().getArray();
        },
        /**
         * Wird denke ich nicht mehr gebraucht
         */
        // moveLayer: function (args) {
        //     var layers, index, layersCollection, model;
        //     layers = this.get('map').getLayers().getArray();
        //     console.log(layers);
        //     index = layers.indexOf(args[1]);
        //     if (index + args[0] < LayerList.length && index + args[0] >= 0) {
        //         console.log(index);
        //         layersCollection = this.get('map').getLayers();
        //         layersCollection.removeAt(index);
        //         layersCollection.insertAt(index + args[0], args[1]);
        //         model = LayerList.at(index);
        //         LayerList.remove(model);
        //         LayerList.add(model, {at: index + args[0]});
        //     }
        // },
        /**
         * Bewegt den Layer auf der Karte an die vorhergesehene Position
         * @param {Array} args - [0] = Layer, [1] = Index
         */
         addLayerToIndex: function (args) {
            var layer = args[0],
                index = args[1],
                layersCollection = this.get("map").getLayers();

            layersCollection.remove(layer);
            layersCollection.insertAt(index, layer);
        },
        /**
        *
        */
        setPositionCoordPopup: function (evt) {
            EventBus.trigger('setPositionCoordPopup', evt.coordinate);
        },
        /**
         * Stellt die notwendigen Parameter für GFI zusammen. Gruppenlayer werden nicht abgefragt, wohl aber deren ChildLayer.
         * scale ist zur Definition der BoundingBox um den Klickpunkt - nur bei WFS
         * routable legt fest, ob das Feature als RoutingDestination gesetzt werden darf.
         * style Anfrage bei WFS, ob Style auf unsichtbar.
         */
        setGFIParams: function (evt) {
            var layersVisible, gfiParams = [], resolution, projection, layers, coordinate;
            coordinate = evt.coordinate;
            layers = this.get('map').getLayers().getArray();
            resolution = this.get('view').getResolution();
            projection = this.get('view').getProjection();
            var scale = this.getCurrentScale();
            layersVisible = _.filter(layers, function (element) {
                // NOTE GFI-Filter Nur Sichtbar
                return element.getVisible() === true;
            });
            _.each(layersVisible, function (element) {
                var gfiAttributes = element.get('gfiAttributes');
                if (_.isObject(gfiAttributes) || _.isString(gfiAttributes) && gfiAttributes.toUpperCase() !== 'IGNORE') {
                    if (element.getProperties().typ === 'WMS') {
                        var gfiURL = element.getSource().getGetFeatureInfoUrl(
                            coordinate, resolution, projection,
                            {'INFO_FORMAT': 'text/xml'}
                        );
                        gfiParams.push({
                            typ: 'WMS',
                            scale: scale,
                            url: gfiURL,
                            name: element.get('name'),
                            attributes: gfiAttributes,
                            routable: element.get('routable')
                        });
                    }
                    else if (element.getProperties().typ === 'WFS') {
                        gfiParams.push({
                            typ: 'WFS',
                            scale: scale,
                            source: element.getSource(),
                            style: element.getStyle(),
                            name: element.get('name'),
                            attributes: gfiAttributes,
                            routable: element.get('routable')
                        });
                    }
                }
            });
            EventBus.trigger('setGFIParams', [gfiParams, coordinate]);
        },
        setCenter: function (coord, zoomLevel) {
            this.get('map').getView().setCenter(coord);
            if (zoomLevel !== undefined) {
                this.get('map').getView().setZoom(zoomLevel);
            }
        },
        zoomToExtent: function (extent) {
            this.get('view').fitExtent(extent, this.get('map').getSize());
        },
        setZoomLevelUp: function () {
            var zoomLevel = this.get('view').getZoom();
            this.get('view').setZoom(zoomLevel + 1);
        },
        setZoomLevelDown: function () {
            var zoomLevel = this.get('view').getZoom();
            this.get('view').setZoom(zoomLevel -1);
        },
        updatePrintPage: function (args) {
            this.set("layoutPrintPage", args[1]);
            this.set("scalePrintPage", args[2]);
            if(args[0] === true) {
                this.get('map').on('precompose', this.handlePreCompose);
                this.get('map').on('postcompose', this.handlePostCompose, this);
            }
            else {
                this.get('map').un('precompose', this.handlePreCompose);
                this.get('map').un('postcompose', this.handlePostCompose, this);
            }
            this.get('map').render();
        },
        calculatePageBoundsPixels: function () {
            var s = this.get("scalePrintPage");
            var width = this.get("layoutPrintPage").width;
            var height = this.get("layoutPrintPage").height;
            var view = this.get('map').getView();
            var resolution = view.getResolution();
            var w = width / DOTS_PER_INCH * MM_PER_INCHES / 1000.0 * s / resolution * ol.has.DEVICE_PIXEL_RATIO;
            var h = height / DOTS_PER_INCH * MM_PER_INCHES / 1000.0 * s / resolution * ol.has.DEVICE_PIXEL_RATIO;
            var mapSize = this.get('map').getSize();
            var center = [mapSize[0] * ol.has.DEVICE_PIXEL_RATIO / 2 ,
            mapSize[1] * ol.has.DEVICE_PIXEL_RATIO / 2];
            var minx, miny, maxx, maxy;
            minx = center[0] - (w / 2);
            miny = center[1] - (h / 2);
            maxx = center[0] + (w / 2);
            maxy = center[1] + (h / 2);
            return [minx, miny, maxx, maxy];
        },
        handlePreCompose: function(evt) {
            var ctx = evt.context;
            ctx.save();
        },
        handlePostCompose: function(evt) {
            var ctx = evt.context;
            var size =  this.get('map').getSize();
            var height = size[1] * ol.has.DEVICE_PIXEL_RATIO;
            var width = size[0] * ol.has.DEVICE_PIXEL_RATIO;
            var minx, miny, maxx, maxy;
            var printPageRectangle = this.calculatePageBoundsPixels();
            minx = printPageRectangle[0], miny = printPageRectangle[1],
            maxx = printPageRectangle[2], maxy = printPageRectangle[3];
            ctx.beginPath();
            // Outside polygon, must be clockwise
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.lineTo(0, 0);
            ctx.closePath();
            // Inner polygon,must be counter-clockwise
            ctx.moveTo(minx, miny);
            ctx.lineTo(minx, maxy);
            ctx.lineTo(maxx, maxy);
            ctx.lineTo(maxx, miny);
            ctx.lineTo(minx, miny);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 5, 25, 0.55)';
            ctx.fill();
            ctx.restore();
        }
    });

    return Map;
});
