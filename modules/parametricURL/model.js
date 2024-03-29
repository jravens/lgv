define([
    'underscore',
    'config',
    'backbone'
], function (_, Config, Backbone) {

    var ParametricURL = Backbone.Model.extend({

        initialize: function () {
            // Parsen des parametrisierten Aufruf --> http://wscd0096/libs/lgv/portale/master?layerIDs=453,1346&center=555874,5934140&zoomLevel=4&isMenubarVisible=false
            var query = location.search.substr(1).toUpperCase(); // URL --> alles nach ? wenn vorhanden
            var result = {};
            query.split("&").forEach(function (keyValue) {
                var item = keyValue.split("=");
                result[item[0]] = decodeURIComponent(item[1]); // item[0] = key; item[1] = value;
            });
            /**
             * Gibt die initiale Zentrumskoordinate zurück.
             * Ist der Parameter 'center' vorhanden wird dessen Wert zurückgegeben, ansonsten der Standardwert.
             */
            if (_.has(result, 'CENTER')) {
                var values = _.values(_.pick(result, 'CENTER'))[0].split(',');
                _.each(values, function(value, index, list) {
                    value = parseInt(value);
                    values[index] = value;
                });
                Config.view.center = values
            }

            /**
             * Gibt die LayerIDs für die Layer zurück, die initial sichtbar sein sollen.
             * Ist der Parameter 'layerIDs' vorhanden werden dessen IDs zurückgegeben, ansonsten die konfigurierten IDs.
             */
            if (_.has(result, 'LAYERIDS')) {
                var values = _.values(_.pick(result, 'LAYERIDS'))[0].split(',');
                var newLayerIDs = Config.layerIDs;
                newLayerIDs.forEach(function(layerID){
                    if (_.find(values, function (value) {return value == layerID.id})) {
                        layerID.visible = true;
                    }
                    else if (_.isArray(layerID.id)) {
                        var idlist = '';
                        _.each(layerID.id, function (ele, index, list) {
                            idlist = idlist + '_' + ele.id;
                        });
                        idlist = idlist.substr(1);
                        if (_.find(values, function (value) {return value == idlist})) {
                            layerID.visible = true;
                        }
                        else {
                            layerID.visible = false;
                        }
                    }
                    else {
                        layerID.visible = false;
                    }
                });
                Config.layerIDs = newLayerIDs;
            }

            /**
             * Gibt die initiale Resolution (Zoomlevel) zurück.
             * Ist der Parameter 'zoomLevel' vorhanden wird die passende Resolution zurückgegeben, ansonsten der Standardwert.
             */
            if (_.has(result, 'ZOOMLEVEL')) {
                var value = _.values(_.pick(result, 'ZOOMLEVEL'))[0];
                var resolutions = {
                    '1': 66.14614761460263,  // 1:250:000
                    '2': 26.458319045841044, // 1:100.000
                    '3': 15.874991427504629, // 1:60.000
                    '4': 10.583327618336419, // 1:40.000
                    '5': 5.2916638091682096, // 1:20.000
                    '6': 2.6458319045841048, // 1:10.000
                    '7': 1.3229159522920524, // 1:5.000
                    '8': 0.6614579761460262, // 1:2.500
                    '9': 0.2645831904584105  // 1:1.000
                };
                Config.view.resolution = resolutions[value];
            }

            /**
            * Gibt den Wert für die config-Option isMenubarVisible zurück.
            * Ist der Parameter 'isMenubarVisible' vorhanden, wird dieser zurückgegeben, ansonsten der Standardwert.
            *
            */
            if (_.has(result, 'ISMENUBARVISIBLE')) {
                var value = _.values(_.pick(result, 'ISMENUBARVISIBLE'))[0].toUpperCase();
                if (value ==  'TRUE') {
                    Config.isMenubarVisible = true;
                }
                else {
                    Config.isMenubarVisible = false;
                }
            }

            /**
            * Gibt den Wert für die config-Option isMenubarVisible zurück.
            * Ist der Parameter 'isMenubarVisible' vorhanden, wird dieser zurückgegeben, ansonsten der Standardwert.
            *
            */
            if (_.has(result, 'STARTUPMODUL')) {
                var value = _.values(_.pick(result, 'STARTUPMODUL'))[0].toUpperCase();
                Config.startUpModul = value;
            }

            /**
            *
            */
            if (_.has(result, 'QUERY')) {
                var value = _.values(_.pick(result, 'QUERY'))[0];
                value = value.substring(0, 1) + value.substring(1).toLowerCase();
                Config.searchBar.initString = value;
            }

            /**
            * Gibt den Wert für die config-Option clickCounter.enabled zurück.
            *
            */
            if (_.has(result, 'CLICKCOUNTER')) {
                var value = _.values(_.pick(result, 'CLICKCOUNTER'))[0].toUpperCase();
                Config.clickCounter.version = value;
            }
        }
    });

    return ParametricURL;
});
