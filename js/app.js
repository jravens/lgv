// if (window.location.href.charAt(window.location.href.length-1) === "#") {
//     window.location.href = window.location.href.substr(0, window.location.href.length-2);
// }
define("app", ["jquery", "config", "modules/attribution/view"], function ($, Config, AttView) {
    "use strict";

    if (Config.allowParametricURL && Config.allowParametricURL === true) {
        require(["modules/parametricURL/model"], function (ParametricURL) {
            new ParametricURL();
        });
    }

    if (_.has(Config.tree, "custom") && Config.tree.custom === true) {
        require(["modules/treeconfig/list"], function (TreeConfig) {
            new TreeConfig();
        });
    }

    // TODO Über Config-Parameter steuern. In Config-Pfad(e) angeben und diesen dann laden
    require(["../portale/verkehrsportal/verkehrsfunctions"], function (Vf) {
        new Vf();
    });

    if (Config.attributions && Config.attributions === true) {
        new AttView();
    }

    require([
        "modules/core/map",
        "config",
        "jquery"
    ], function (Map, Config, $) {
        new Map();

        if (Config.footer && Config.footer === true) {
            require(["modules/footer/view"], function (FooterView) {
                new FooterView();
            });
        }

        if (typeof (Config.clickCounter) === "object" && Config.clickCounter.version !== "") {
            require(["modules/ClickCounter/view"], function (ClickCounterView) {
                new ClickCounterView();
            });
        }

        if (Config.mouseHover && Config.mouseHover === true) {
            require(["views/MouseHoverPopupView"], function (MouseHoverPopupView) {
                new MouseHoverPopupView();
            });
        }

        if (Config.quickHelp && Config.quickHelp === true) {
            require(["modules/quickhelp/view"], function (QuickHelpView) {
                new QuickHelpView();
            });
        }

        if (Config.scaleLine && Config.scaleLine === true) {
            require(["modules/scaleline/view"], function (ScaleLineView) {
                new ScaleLineView();
            });
        }

        if (Config.menubar === true) {
            require(["modules/menubar/view", "views/ToggleButtonView", "views/ZoomButtonsView"], function (MenubarView, ToggleButtonView, ZoomButtonsView) {
                new MenubarView();
                new ToggleButtonView();
                new ZoomButtonsView();
                require(["views/WindowView"], function (WindowView) {
                    new WindowView();
                });
                if (Config.menu.tools === true) {
                    if (Config.tools.coord === true) {
                        require(["modules/coordpopup/view"], function (CoordPopupView) {
                            new CoordPopupView();
                        });
                    }
                    if (Config.tools.gfi === true) {
                        require(["modules/gfipopup/view", "modules/gfipopup/viewMobile", "modules/core/util"], function (GFIPopupView, MobileGFIPopupView, Util) {
                            if (Util.isAny()) {
                                new MobileGFIPopupView();
                            }
                            else {
                                new GFIPopupView();
                            }
                        });
                    }
                    if (Config.tools.measure === true) {
                        require(["views/MeasureView"], function (MeasureView) {
                            new MeasureView();
                        });
                    }
                    if (Config.tools.draw === true) {
                        require(["views/DrawView"], function (DrawView) {
                            new DrawView();
                        });
                    }
                    if (Config.tools.print === true) {
                        // require(["views/PrintView"], function (PrintView) {
                        //     new PrintView();
                        // });
                        require(["modules/print/view"], function (PrintView) {
                            new PrintView();
                        });
                    }
                    require(["views/ToolsView"], function (ToolsView) {
                        new ToolsView();
                    });
                }
                if (Config.menu.treeFilter === true) {
                    require(["modules/treefilter/view"], function (TreeFilterView) {
                        new TreeFilterView();
                    });
                }
                if (Config.menu.searchBar === true) {
                    require(["modules/searchbar/view"], function (SearchbarView) {
                        new SearchbarView();
                    });
                }
                if (Config.menu.wfsFeatureFilter === true) {
                    require(["modules/wfsfeaturefilter/view"], function (WFSFeatureFilterView) {
                        new WFSFeatureFilterView();
                    });
                }
                if (Config.orientation === true) {
                    require(["views/OrientationView"], function (OrientationView) {
                        new OrientationView();
                    });
                }
                if (Config.poi === true) {
                    require(["views/PointOfInterestView", "views/PointOfInterestListView"], function (PointOfInterestView, PointOfInterestListView) {
                        // new PointOfInterestView();
                        new PointOfInterestListView();
                    });
                }
                if (Config.menu.legend === true) {
                    require(["views/LegendView"], function (LegendView) {
                        new LegendView();
                    });
                }
                if (Config.menu.routing === true) {
                    require(["modules/routing/view"], function (RoutingView) {
                        new RoutingView();
                    });
                }
                if ($.isArray(Config.menu.formular)) {
                    $.each(Config.menu.formular, function (name, obj) {
                        if (obj.title !== '' && obj.symbol !== '' && obj.modelname !== '') {
                            require(["modules/formular/view"], function (FormularView) {
                                new FormularView(obj.modelname, obj.title, obj.symbol);
                            });
                        }
                    });
                }
            });

        }
        $(function () {
            $("#loader").hide();
        });
    });
});
