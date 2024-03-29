define([
    'jquery',
    'underscore',
    'backbone',
    'text!modules/wfsfeaturefilter/template.html',
    'modules/wfsfeaturefilter/model',
    'eventbus',
    'config'
], function ($, _, Backbone, wfsFeatureFilterTemplate, wfsFeatureFilter, EventBus, Config) {

var wfsFeatureFilterView = Backbone.View.extend({
        model: wfsFeatureFilter,
        id: 'wfsFilterWin',
        className: 'win-body',
        template: _.template(wfsFeatureFilterTemplate),
        initialize: function () {
            this.model.on("change:isCollapsed change:isCurrentWin", this.render, this); // Fenstermanagement
        },
        events: {
            'click #filterbutton': 'getFilterInfos'
        },
        getFilterInfos: function () {
            var wfsList = this.model.get('wfsList');
            var layerfilters = new Array();
            var filters = new Array();
            _.each(wfsList, function (layer, index, list) {
                _.each(layer.filterOptions, function (filter, index, list) {
                    var id = '#' + layer.layerId + '_' + filter.fieldName;
                    var value = $(id).val();
                    filters.push(
                        {
                            id: id,
                            filtertype: filter.filterType,
                            fieldName: filter.fieldName,
                            fieldValue: value
                        }
                    );
                });
                layerfilters.push(
                    {
                        layerId: layer.layerId,
                        filter: filters
                    }
                );
            });
            if (layerfilters.length > 0) {
                this.filterLayers(layerfilters);
            }
        },
        filterLayers: function (layerfilters) {
            var that = this;
            _.each(layerfilters, function(layerfilter, index, list) {
                // Prüfe, ob alle Filter des Layers auf * stehen, damit evtl. der defaultStyle geladen werden kann
                var showall = true;
                _.each(layerfilter.filter, function (filter, index, list) {
                    if (filter.fieldValue != '*') {
                        showall = false;
                    }
                });

                that.model.get('map').getLayers().forEach(function (layer) {
                    if (layer.getProperties().typ == 'WFS')
                    {
                        var layerid = layer.id;

                        // Hier wird der zum Filter zugehörige Layer gefunden
                        if (layerid === layerfilter.layerId) {

                            if (showall === true) {
                                if (layer.defaultStyle) {
                                    layer.setStyle(layer.defaultStyle);
                                    delete layer.defaultStyle;
                                    layer.getSource().getFeatures().forEach(function (feature) {
                                        if (feature.defaultStyle) {
                                            feature.setStyle(feature.defaultStyle);
                                            delete feature.defaultStyle;
                                        }
                                    });
                                }
                            }
                            else {

                                // Falls Layer gestyled wurde, speichere den Style und schalte unsichtbar
                                if (layer.getStyle()) {
                                    layer.defaultStyle = layer.getStyle();
                                    layer.setStyle(null);
                                }

                                var features = layer.getSource().getFeatures();
                                features.forEach(function(feature) {
                                    var featuredarstellen = true;
                                    // Prüfung, ob Feature dargestellt werden soll
                                    _.each(layerfilter.filter, function (elementfilter, index, list) {
                                        var attributname = elementfilter.fieldName;
                                        var attributvalue = elementfilter.fieldValue;
                                        if (attributvalue != '*') {
                                            var featureattribute = _.pick(feature.getProperties(), attributname);
                                            if (featureattribute && !_.isNull(featureattribute)) {
                                                var featurevalue0 = _.values(featureattribute)[0];
                                                if (featurevalue0) {
                                                    var featurevalue = featurevalue0.trim();
                                                    if (featurevalue != attributvalue) {
                                                        featuredarstellen = false;
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    if (featuredarstellen === true) {
                                        if (feature.defaultStyle) {
                                            feature.setStyle(feature.defaultStyle);
                                            delete feature.defaultStyle;
                                        }
                                        else {
                                            feature.setStyle(layer.defaultStyle);
                                        }
                                    }
                                    else if (featuredarstellen === false){
                                        /*
                                            Bug in OL 3.0.0 #2725.
                                            feature.setStyle(null);
                                            Resolved vermutlich mit 3.1.0
                                        */
                                        if (feature.getStyle() && feature.getStyle()[0].getImage().getSrc() != '../../img/blank.png') {
                                            feature.defaultStyle = feature.getStyle();
                                        }
                                        if (feature.defaultStyle) {
                                            if (feature.getStyle()) {
                                                //var newStyle = feature.getStyle();
                                                var imagestyle = new ol.style.Icon({
                                                    src: '../../img/blank.png',
                                                    width: 10,
                                                    height: 10,
                                                    scale: 1
                                                });
                                                var style = [
                                                    new ol.style.Style({
                                                        image: imagestyle,
                                                        zIndex: 'Infinity'
                                                    })
                                                ];
                                                feature.setStyle(style);
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                }, this);
            });
            this.model.set('layerfilters', layerfilters);
        },
        render: function () {
            if (this.model.get("isCurrentWin") === true && this.model.get("isCollapsed") === false) {
                this.model.prep();
                var attr = this.model.toJSON();
                this.$el.html("");
                $(".win-heading").after(this.$el.html(this.template(attr)));
                this.delegateEvents();
            } else if (this.model.get("isCurrentWin") === false) {
                var layerfilters = this.model.get('layerfilters');
                if (layerfilters) {
                    _.each(layerfilters, function(layerfilter, index, list) {
                        _.each(layerfilter.filter, function (filter, index, list) {
                            filter.fieldValue = '*';
                        });
                    });
                    this.filterLayers(layerfilters);
                }
            }
        }
    });

    return wfsFeatureFilterView;
});
