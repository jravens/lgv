define([
    "jquery",
    "underscore",
    "backbone",
    "text!templates/PointOfInterestList.html",
    "collections/PointOfInterestList",
    "views/PointOfInterestView",
    "eventbus",
    "bootstrap/tab",
    "bootstrap/modal"
], function ($, _, Backbone, PointOfInterestListTemplate, PointOfInterestList, PointOfInterestView, EventBus) {

    var PointOfInterestListView = Backbone.View.extend({
        collection: PointOfInterestList,
        id: "base-modal",
        className: "modal fade in",
        template: _.template(PointOfInterestListTemplate),
        events: {
            "click .close, button,table,#500m,#1000m,#2000m": "removeAllModels",
            "click #500m": "onClick500m",
            "click #1000m": "onClick1000m",
            "click #2000m": "onClick2000m"
        },
        initialize: function () {
            EventBus.on("showPOIModal", this.show, this);
            EventBus.on("hidePOIModal", this.hide, this);
            this.listenTo(this.collection, "sort", this.addPOIS);
            this.render();
        },
        render: function () {
            this.$el.html(this.template());
        },
        addPOIS: function (collection) {
            this.$("table").html("");
            _.each(collection.models, function (model) {
                var poiView = new PointOfInterestView({model: model});

                this.$("table").append(poiView.render().el);
            }, this);
        },
        removeAllModels: function () {
            this.collection.removeAllModels();
            this.render();
        },
        show: function () {
            this.$el.modal({
                backdrop: true,
                show: true
            });
            $(function () {
                $("#loader").hide();
            });
        },
        hide: function () {
            this.$el.modal("hide");
        },
        onClick500m: function () {
            EventBus.trigger("getPOI", 500);
            $("#500m a[href='#500Meter']").tab("show");
        },
        onClick1000m: function () {
            EventBus.trigger("getPOI", 1000);
            $("#1000m a[href='#1000Meter']").tab("show");
        },
        onClick2000m: function () {
            EventBus.trigger("getPOI", 2000);
            $("#2000m a[href='#2000Meter']").tab("show");
        }
    });

    return PointOfInterestListView;
});
