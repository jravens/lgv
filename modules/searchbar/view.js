define([
    "backbone",
    "openlayers",
    "text!modules/searchbar/template.html",
    "text!modules/searchbar/templateRecommendedList.html",
    "text!modules/searchbar/templateHitList.html",
    "modules/searchbar/model",
    "eventbus",
    "config"
    ], function (Backbone, ol, SearchbarTemplate, SearchbarRecommendedListTemplate, SearchbarHitListTemplate, Searchbar, EventBus, Config) {

        var searchVector = new ol.layer.Vector({
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "#08775f",
                    lineDash: [8],
                    width: 4
                }),
                fill: new ol.style.Fill({
                    color: "rgba(8, 119, 95, 0.3)"
                })
            })
        });

        EventBus.trigger("addLayer", searchVector);

        var SearchbarView = Backbone.View.extend({
            model: Searchbar,
            id: "searchbar",
            // tagName: "form",
            className: "navbar-form col-xs-9",
            template: _.template(SearchbarTemplate),
            initialize: function () {
                this.listenTo(this.model, "change:searchString", this.render);
                this.listenTo(this.model, "change:isHitListReady", this.renderRecommendedList);
                this.listenTo(this.model, "change:initString", this.checkInitString);
                this.render();
                // if (Config.bPlan !== undefined) {
                //     $("#searchInput").prop("disabled", "");
                // }
                $(window).on("orientationchange", function () {
                    this.render();
                }, this);
                if (navigator.appVersion.indexOf("MSIE 9.") !== -1) {
                    $("#searchInput").val(this.model.get("placeholder"));
                }
                $("#searchInput").blur();
            },
            events: {
                "keyup input": "setSearchString",
                "focusin input": "toggleStyleForRemoveIcon",
                "focusout input": "toggleStyleForRemoveIcon",
                "click .btn-deleteSearch": "deleteSearchString",
                "click .btn-search": "renderHitList",
                "click .list-group-item.hit": "zoomTo",
                "mouseover .list-group-item.hit": "showMarker",
                "mouseleave .list-group-item.hit": "hideMarker",
                "click .list-group-item.type": "collapseHits",
                "mouseover ": "showHelp",
                "mouseleave ": "hideHelp",
                "click .glyphicon-question-sign": "showHelpWindow"
            },
            /**
            *
            */
            render: function () {
                var attr = this.model.toJSON();

                this.$el.html(this.template(attr));
                if (window.innerWidth < 768) {
                    $(".navbar-toggle").before(this.$el); // vor dem toggleButton
                }
                else {
                    $(".navbar-collapse").append(this.$el); // rechts in der Menuebar
                }
                this.focusOnEnd($("#searchInput"));
                if (this.model.get("searchString").length !== 0) {
                    $("#searchInput:focus").css("border-right-width", "0");
                }
            },

            /**
            *
            */
            renderRecommendedList: function () {
                if (this.model.get("isHitListReady") === true) {
                    var attr = this.model.toJSON(),
                    // sz, will in lokaler Umgebung nicht funktionieren, daher erst das Template als Variable
                    // $("ul.dropdown-menu-search").html(_.template(SearchbarRecommendedListTemplate, attr));
                    template = _.template(SearchbarRecommendedListTemplate);

                    $("ul.dropdown-menu-search").html(template(attr));
                }
                if (Config.searchBar.initString !== undefined) { // workaround für die initiale Suche von B-Plänen
                    this.model.set("initString", Config.searchBar.initString);
                }
            },

            /**
            *
            */
            renderHitList: function () {
                if (this.model.get("isHitListReady") === true) {
                    if (this.model.get("hitList").length <= 2) {
                        var types = _.pluck(this.model.get("hitList"), "type");

                        if (_.contains(types, "Straße") && _.contains(types, "Adresse")) {
                            var hit = _.findWhere(this.model.get("hitList"), {type: "Adresse"});

                            this.model.get("marker").setPosition(hit.coordinate);
                            $("#searchMarker").css("display", "block");
                            $(".dropdown-menu-search").hide();
                            EventBus.trigger("setCenter", hit.coordinate, 7);
                        }
                    }
                    else {
                        this.model.set("typeList", _.uniq(_.pluck(this.model.get("hitList"), "type")));
                        var attr = this.model.toJSON(),
                        // sz, will in lokaler Umgebung nicht funktionieren, daher erst das Template als Variable
                        // $("ul.dropdown-menu-search").html(_.template(SearchbarHitListTemplate, attr));
                            template = _.template(SearchbarHitListTemplate);

                        $("ul.dropdown-menu-search").html(template(attr));
                    }
                }
            },

            /**
            *
            */
            setSearchString: function (evt) {
                this.model.setSearchString(evt.target.value); // evt.target.value = Wert aus der Suchmaske
                if (evt.key === "Enter" || evt.keyCode === 13) {
                    if (this.model.get("hitList").length <= 2) {
                        // console.log(this.model.get("hitList"));
                        var types = _.pluck(this.model.get("hitList"), "type");

                        if (_.contains(types, "Straße") && _.contains(types, "Adresse")) {
                            var hit = _.findWhere(this.model.get("hitList"), {type: "Adresse"});

                            this.model.get("marker").setPosition(hit.coordinate);
                            $("#searchMarker").css("display", "block");
                            $(".dropdown-menu-search").hide();
                            EventBus.trigger("setCenter", hit.coordinate, 7);
                        }
                        else if (_.contains(types, "Parcel")) {
                            var hit = _.findWhere(this.model.get("hitList"), {type: "Parcel"});

                            this.model.get("marker").setPosition(hit.coordinate);
                            $("#searchMarker").css("display", "block");
                            $(".dropdown-menu-search").hide();
                            EventBus.trigger("setCenter", hit.coordinate, 7);
                        }
                    }
                    else {
                        this.renderHitList();
                    }
                }
            },

            /**
            *
            */
            collapseHits: function (evt) {
                $(".list-group-item.type + div").hide("slow"); // schließt alle Reiter
                if ($(evt.currentTarget.nextElementSibling).css("display") === "block") {
                    $(evt.currentTarget.nextElementSibling).hide("slow");
                }
                else {
                    $(evt.currentTarget.nextElementSibling).show("slow");
                }
            },

            /**
            *
            */
            toggleStyleForRemoveIcon: function (evt) {
                if (evt.type === "focusin") {
                    if (navigator.appVersion.indexOf("MSIE 9.") !== -1) {
                        if ($("#searchInput").val() === this.model.get("placeholder")) {
                            $("#searchInput").val("");
                        }
                    }
                    $(".btn-deleteSearch").css("border-color", "#66afe9");
                }
                else if (evt.type === "focusout") {
                    if (navigator.appVersion.indexOf("MSIE 9.") !== -1) {
                        if ($("#searchInput").val() === "") {
                            $("#searchInput").val(this.model.get("placeholder"));
                        }
                    }
                    $(".btn-deleteSearch").css("border-color", "#cccccc");
                }
            },

            /**
            *
            */
            deleteSearchString: function () {
                this.model.setSearchString("");
                this.focusOnEnd($("#searchInput"));
                this.hideMarker();
                searchVector.getSource().clear();
            },

            checkInitString: function (evt) {
                if (this.model.get("hitList").length < 3 && this.model.get("hitList").length > 0) {
                    this.zoomTo(evt);
                }
            },

            /**
            *
            */
            zoomTo: function (evt) {
                var zoomLevel, hitID, hit;

                if (_.has(evt, "cid")) { // in diesem Fall ist evt = model, für die initiale Suche von B-Plänen --> workaround
                    if (Config.searchBar.initString.search(",") !== -1) {
                        hit = this.model.get("hitList")[1]; // initial Suche Adresse mit Hausnummer
                    }
                    else {
                        hit = this.model.get("hitList")[0]; // alles andere, Straßen, BPläne, Flurstücke...
                    }
                }
                else {
                    hitID = evt.currentTarget.id;
                    hit = _.findWhere(this.model.get("hitList"), {id: hitID});
                }
                // NOTE switch case wäre angebracht

                $("#searchInput").val(hit.name);
                if (hit.type === "Straße") {
                    var wkt = this.getWKTFromString("POLYGON", hit.coordinate),
                        extent,
                        format = new ol.format.WKT(),
                        feature = format.readFeature(wkt);

                    searchVector.getSource().clear();
                    searchVector.getSource().addFeature(feature);
                    searchVector.setVisible(true);
                    extent = feature.getGeometry().getExtent();
                    EventBus.trigger("zoomToExtent", extent);
                    $(".dropdown-menu-search").hide();
                }
                else if (hit.type === "Krankenhaus") {
                    $(".dropdown-menu-search").hide();
                    EventBus.trigger("setCenter", hit.coordinate, 5);
                }
                else if (hit.type === "Adresse" || hit.type === "Stadtteil") {
                    zoomLevel = 7;
                    this.model.get("marker").setPosition(hit.coordinate);
                    $("#searchMarker").css("display", "block");
                    $(".dropdown-menu-search").hide();
                    EventBus.trigger("setCenter", hit.coordinate, zoomLevel);
                }
                else if (hit.type === "Thema") {
                    $(".dropdown-menu-search").hide();
                    EventBus.trigger("showLayerInTree", hit.model);
                    evt.stopPropagation();
                }
                else if (hit.type === "Olympiastandort") {
                    zoomLevel = 5;
                    this.model.get("marker").setPosition(hit.coordinate);
                    $("#searchMarker").css("display", "block");
                    $(".dropdown-menu-search").hide();
                    EventBus.trigger("setCenter", hit.coordinate, zoomLevel);
                }
                else if (hit.type === "festgestellt" || hit.type === "im Verfahren") { // kann bestimmt noch besser gemacht werden. ins model?
                    var typeName = (hit.type === "festgestellt") ? "hh_hh_planung_festgestellt" : "imverfahren",
                        propertyName = (hit.type === "festgestellt") ? "planrecht" : "plan";

                    $.ajax({
                        url: Config.searchBar.getFeatures[0].url,
                        data: "<?xml version='1.0' encoding='UTF-8'?><wfs:GetFeature service='WFS' version='1.1.0' xmlns:app='http://www.deegree.org/app' xmlns:wfs='http://www.opengis.net/wfs' xmlns:gml='http://www.opengis.net/gml' xmlns:ogc='http://www.opengis.net/ogc' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd'><wfs:Query typeName='" + typeName + "'><ogc:Filter><ogc:PropertyIsEqualTo><ogc:PropertyName>app:" + propertyName + "</ogc:PropertyName><ogc:Literal>" + hit.name + "</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter></wfs:Query></wfs:GetFeature>",
                        type: "POST",
                        context: this, // model
                        contentType: "text/xml",
                        success: function (data) {
                            var wkt;
                            // Firefox, IE
                            if (data.getElementsByTagName("gml:Polygon")[0] !== undefined) {
                                var hits = data.getElementsByTagName("gml:Polygon"),
                                wktArray = [],
                                wkt,
                                geom;

                                if (hits.length > 1) {
                                    _.each(hits, function (hit) {
                                        if (hit.getElementsByTagName("gml:interior")[0] !== undefined) {
                                            geom = hit.getElementsByTagName("gml:posList")[0].textContent + " )?(";
                                            geom += hit.getElementsByTagName("gml:posList")[1].textContent;
                                        }
                                        else {
                                            geom = hit.getElementsByTagName("gml:posList")[0].textContent;
                                        }
                                        wktArray.push(geom);
                                    });
                                    wkt = this.getWKTFromString("MULTIPOLYGON", wktArray);
                                }
                                else {
                                    var geom = data.getElementsByTagName("gml:posList")[0].textContent;

                                    wkt = this.getWKTFromString("POLYGON", geom);
                                }
                            }
                            // WebKit
                            else if (data.getElementsByTagName("Polygon")[0] !== undefined) {
                                var hits = data.getElementsByTagName("Polygon"),
                                wktArray = [],
                                geom;

                                if (hits.length > 1) {
                                    _.each(hits, function (hit) {
                                        if (hit.getElementsByTagName("interior")[0] !== undefined) {
                                            geom = hit.getElementsByTagName("posList")[0].textContent + " )?(";
                                            geom += hit.getElementsByTagName("posList")[1].textContent;
                                        }
                                        else {
                                            geom = hit.getElementsByTagName("posList")[0].textContent;
                                        }
                                        wktArray.push(geom);
                                    });
                                    wkt = this.getWKTFromString("MULTIPOLYGON", wktArray);
                                }
                                else {
                                    var geom = data.getElementsByTagName("posList")[0].textContent;

                                    wkt = this.getWKTFromString("POLYGON", geom);
                                }
                            }
                            var format = new ol.format.WKT(),
                            extent,
                            feature = format.readFeature(wkt);

                            searchVector.getSource().clear();
                            searchVector.getSource().addFeature(feature);
                            searchVector.setVisible(true);
                            // console.log(feature.getGeometry().getExtent());
                            extent = feature.getGeometry().getExtent();
                            EventBus.trigger("zoomToExtent", extent);
                            $(".dropdown-menu-search").hide();
                        },
                        error: function () {
                            // $('#loader').hide();
                        }
                    });
                }
            },

            /**
            *
            */
            showMarker: function (evt) {
                // console.log(evt);
                var hitID = evt.currentTarget.id,
                hit = _.findWhere(this.model.get("hitList"), {id: hitID});

                if (hit.type === "Straße") {
                    var wkt = this.getWKTFromString("POLYGON", hit.coordinate),
                    format = new ol.format.WKT(),
                    feature = format.readFeature(wkt);

                    searchVector.getSource().clear();
                    searchVector.setVisible(true);
                    searchVector.getSource().addFeature(feature);
                }
                else if (hit.type === "Adresse" || hit.type === "Stadtteil" || hit.type === "Olympiastandort") {
                    this.model.get("marker").setPosition(hit.coordinate);
                    $("#searchMarker").css("display", "block");
                }
            },

            /**
            *
            */
            hideMarker: function () {
                if ($(".dropdown-menu-search").css("display") === "block") {
                    $("#searchMarker").css("display", "none");
                    searchVector.setVisible(false);
                    // this.zoomTo(evt);
                }
                // else {
                    // this.zoomTo(evt);
                // }
            },

            /**
            *
            */
            getWKTFromString: function (type, geom) {
                var wkt;

                if (type === "POLYGON") {
                    var split = geom.split(" ");

                    wkt = type + "((";
                _.each(split, function (element, index, list) {
                    if (index % 2 === 0) {
                        wkt += element + " ";
                    }
                    else if (index === list.length - 1) {
                        wkt += element + "))";
                    }
                    else {
                        wkt += element + ", ";
                    }

                });
                }
                else if (type === "MULTIPOLYGON") {
                    wkt = type + "(((";
                    _.each(geom, function (element, index) {
                        var split = geom[index].split(" ");

                        _.each(split, function (element, index, list) {
                            if (index % 2 === 0) {
                                wkt += element + " ";
                            }
                            else if (index === list.length - 1) {
                                wkt += element + "))";
                            }
                            else {
                                wkt += element + ", ";
                            }
                        });
                        if (index === geom.length - 1) {
                            wkt += ")";
                        }
                        else {
                            wkt += ",((";
                        }
                    });
                    var regExp = new RegExp(", \\)\\?\\(", "g");

                    wkt = wkt.replace(regExp, "),(");
                }
                return wkt;
            },
            //
            // escapeRegExp: function (string) {
            //     console.log(string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"));
            //     return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
            // },

            /**
            * Platziert den Cursor am Ende vom String
            * @param {Element} element - Das Dom-Element
            */
            focusOnEnd: function (element) {
                var strLength = element.val().length * 2;

                element.focus();
                element[0].setSelectionRange(strLength, strLength);
            },
            showHelp: function () {
                $(".btn-search-question").css("opacity", "1");
            },
            hideHelp: function () {
                $(".btn-search-question").css("opacity", "0");
            },
            showHelpWindow: function () {
                EventBus.trigger("showWindowHelp", "search");
            }
        });

        return SearchbarView;
    });
