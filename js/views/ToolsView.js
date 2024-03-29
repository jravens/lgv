define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/Tools.html',
    'models/Tools',
    'eventbus'
    ], function ($, _, Backbone, ToolsTemplate, Tools, EventBus) {

        var ToolsView = Backbone.View.extend({
            model: Tools,
            el: '#tools',
            template: _.template(ToolsTemplate),
            initialize: function () {
                this.render();
                this.listenTo(this.model, 'change', this.render);
                EventBus.trigger('registerToolsClickInClickCounter', this.$el);
            },
            events: {
                'click #coordinateMenu': 'activateCoordinate',
                'click #gfiMenu': 'activateGFI',
                'click #measureMenu': 'activateMeasure',
                'click #printMenu': 'activatePrint',
                "click #drawMenu": "activateDraw"
            },
            activateCoordinate: function () {
                this.model.activateCoordinate();
                EventBus.trigger("winParams", [false, false, ""]);
            },
            activateGFI: function () {
                this.model.activateGFI();
                EventBus.trigger("winParams", [false, false, ""]);
            },
            activateMeasure: function () {
                EventBus.trigger("toggleWin", ["measure", "Messen", "glyphicon-edit"]);
                this.model.activateMeasure();
            },
            activateDraw: function () {
                EventBus.trigger("toggleWin", ["draw", "Zeichnen", "glyphicon-pencil"]);
                this.model.activateDraw();
            },
            activatePrint: function () {
                // EventBus.trigger('togglePrintWin');
                EventBus.trigger('toggleWin', ['print', 'Druckeinstellungen', 'glyphicon-print']);
            },
            render: function () {
                var attr = this.model.toJSON();
                this.$el.html(this.template(attr));
            }
        });

        return ToolsView;
    });
