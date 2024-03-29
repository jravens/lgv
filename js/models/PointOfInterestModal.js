define([
    'underscore',
    'backbone',
    'openlayers'
], function (_, Backbone, ol) {


    var PointOfInterest = Backbone.Model.extend({
        defaults:{
        poiContent: [],
        name: [],
        kategorie: [],
        coord: [],
        img: [],
        distance: []
        },
        setAttributions: function(poiContent, StyleList, newCenter){
            this.set('name', []);
            this.set('kategorie', []);
            this.set('coord', []);
            this.set('img', []);
            this.set('distance', []);

            _.each(poiContent, function(feature) {
                var featureCluster=feature.getProperties();
                _.each(featureCluster.features, function(element,index) {
                lineStringCoord=newCenter.concat(element.getGeometry().getCoordinates());
                var dist= ol.geom.LineString(linStringCoord).getLength();
                this.get('name').push(element.getProperties().Name);
                this.get('kategorie').push(element.getProperties().Kategorie);
                this.get('coord').push(element.getGeometry().getCoordinates());
                this.get('distance').push();
                var img=_.find(StyleList.models, function (num) {
                        return num.attributes.name == element.getProperties().Kategorie;
                });
                this.get('img').push(img.get('imagesrc'));
                },this)
            },this);
        }


    });

    return new PointOfInterest();
});
