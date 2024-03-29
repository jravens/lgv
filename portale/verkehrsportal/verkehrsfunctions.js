define([
    "backbone",
    "eventbus",
    "config",
    "modules/layer/list",
    "openlayers",
    "jquery",
    "bootstrap/alert"
], function (Backbone, EventBus, Config, LayerList, ol, $) {

    var aktualisiereVerkehrsdaten = Backbone.Model.extend({
        initialize: function () {
            var url;
            EventBus.on("aktualisiereverkehrsnetz", this.refreshVerkehrssituation, this);
            _.each(LayerList.models, function (layerdef) {
                if (layerdef.id === "45") {
                    // layer 45 hat gleiche URL und wurde geladen.
                    url = layerdef.get("url");
                    url = url.replace("http://geofos.fhhnet.stadt.hamburg.de", "/geofos");
                    url = url.replace("http://geofos", "/geofos");
                    url = url.replace("http://geodienste-hamburg.de", "/geodienste-hamburg");
                }
            });
            this.set("url", url);
            this.refreshVerkehrsmeldung();
        },
        refreshVerkehrssituation: function (attributions, layer) {
            if (!layer) {
                return;
            }
            var newEventValue = "";
            postmessage = "<wfs:GetFeature xmlns:wfs='http://www.opengis.net/wfs' service='WFS' version='1.1.0' xsi:schemaLocation='http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>";

            postmessage += "<wfs:Query typeName='feature:bab_vkl' srsName='epsg:25832'>";
            postmessage += "<ogc:Filter xmlns:ogc='http://www.opengis.net/ogc'>";
            postmessage += "<ogc:PropertyIsLessThan>";
            postmessage += "<ogc:PropertyName>vkl_id</ogc:PropertyName>";
            postmessage += "<ogc:Literal>2</ogc:Literal>";
            postmessage += "</ogc:PropertyIsLessThan>";
            postmessage += "</ogc:Filter>";
            postmessage += "</wfs:Query>";
            postmessage += "</wfs:GetFeature>";
            var url = this.get("url");
            // diese Abfrage füllt die Attribution
            $.ajax({
                url: url,
                type: "POST",
                data: postmessage,
                headers: {
                    "Content-Type": "application/xml; charset=UTF-8"
                },
                success: function (data) {
                    var nodeList, node;

                    if (data.getElementsByTagName("gml:featureMember")[0]) {
                        nodeList = data.getElementsByTagName("gml:featureMember")[0].childNodes[0].nextSibling.childNodes;
                        node = _.filter(nodeList, function (element) {
                            return element.localName === "received";
                        });
                    }
                    if (data.getElementsByTagName("featureMember")[0]) {
                        nodeList = data.getElementsByTagName("featureMember")[0].childNodes[0].nextSibling.childNodes;
                        node = _.filter(nodeList, function (element) {
                            return element.localName === "received";
                        });
                    }
                    if (node && node[0]) {
                        newEventValue = "<strong>aktuelle Meldungen der TBZ:</strong></br>Aktualität: " + node[0].textContent.trim().replace("T", " ").substring(0, node[0].textContent.length - 3) + "</br>";
                        this.set("eventAttribution", newEventValue);
                    }
                },
                context: layer,
                error: function () {
                    this.set("eventAttribution", "");
                }
            });
            this.refreshVerkehrsmeldung();
        },
        refreshVerkehrsmeldung: function () {
            var url = this.get("url");
            // diese Abfrage zeigt im Bedarfsfall eine Meldung
            $.ajax({
                url: url,
                data: "SERVICE=WFS&REQUEST=GetFeature&TYPENAME=vkl_hinweis&VERSION=1.1.0",
                async: true,
                context: this,
                success: function (data) {
                    var wfsReader = new ol.format.WFS({
                        featureNS: "http://www.deegree.org/app",
                        featureType: "vkl_hinweis"
                    });

                    try {
						var feature = wfsReader.readFeatures(data)[0],
						hinweis = feature.get("hinweis"),
                        datum = feature.get("stand");

                        if (hinweis && datum) {
                            var html = "<div class='alert alert-warning alert-dismissible' role='alert' style='position: absolute; left: 25%; bottom: 50px;width: 50%;'>";

                            html += "<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times";
                            html += "</span></button>";
                            html += "<strong>Tunnelbetrieb Hamburg: </strong>" + hinweis + " (" + datum + ")";
                            html += "</div>";
                            $("body").append(html);
                        }
					}
					catch (err) {
						return;
					}
                },
                error: function () {
                    var html = "<div class='alert alert-info alert-dismissible' role='alert' style='position: absolute; left: 25%; bottom: 50px;width: 50%;'>";

                    html += "<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times";
                    html += "</span></button>";
                    html += "<strong>Verkehrsmeldungen </strong>der TBZ momentan nicht verfügbar.";
                    html += "</div>";
                    $("body").append(html);
                }
            });
        }
    });

    return aktualisiereVerkehrsdaten;
});
