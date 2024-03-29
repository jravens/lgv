define([
    "underscore",
    "backbone",
    "eventbus"
    ], function (_, Backbone, EventBus) {

        var Window = Backbone.Model.extend({
            defaults: {
                isCollapsed: false,
                isVisible: false
            },
            initialize: function () {
                EventBus.on("toggleWin", this.setParams, this);
                EventBus.on("closeWindow", this.setVisible, this);
                EventBus.on("collapseWindow", this.collapseWindow, this);
                EventBus.on("uncollapseWindow", this.uncollapseWindow, this);
            },
            collapseWindow: function () {
                this.setCollapse(true);
            },
            uncollapseWindow: function () {
                this.setCollapse(false);
            },
            setCollapse: function (value, val) {
                this.set("isCollapsed", value);
            },
            setVisible: function (value) {
                this.set("isVisible", value)
            },
            setParams: function (args) {
                this.set("title", args[1]);
                this.set("icon", args[2]);
                this.set("winType", args[0]);
                this.set("isVisible", true);
            },
            sendParamsToWinCotent: function () {
                EventBus.trigger("winParams", [this.get("isVisible"), this.get("isCollapsed"), this.get("winType")]);
            }
        });

        return new Window();
    }
);
