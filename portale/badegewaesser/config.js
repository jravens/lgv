define(function () {
    var config = {
        wfsImgPath: "../components/lgv-config/img/",
        allowParametricURL: true,
        view: {
            center: [565874, 5934140], // Rathausmarkt
            resolution: 66.14579761460263, // 1:60.000
            scale: 60000 // für print.js benötigt
        },
        layerConf: "../components/lgv-config/services-fhhnet.json",
        categoryConf: "../components/lgv-config/category.json",
        styleConf: "../components/lgv-config/style.json",
        print: {
            url: function () {
                return "http://wscd0096:8680/mapfish_print_2.0/";
            },
            title: "Badegewässer-Portal",
            gfi: false
        },
        proxyURL: "/cgi-bin/proxy.cgi",
        layerIDs:
        [
        {id: "453", visible: true},
        {id: "94", visible: false, name: "Luftbilder"},
        {id:
         [
            {
                id: "1935",
                name: "Bus1"
            },
            {
                id: "1935",
                name: "Bus2"
            }
         ],
         visible: false, name: "HVV Buslinien", styles: ["geofox-bus", "geofox_BusName"]
        },
        {id: "1935", visible: false, styles: "geofox-bahn", name: "HVV Bahnlinien"},
        {id: "1933", visible: false, styles: "geofox_stations", name: "HVV Haltestellen"},
        {id: "1728", visible: true, style: "1728", distance: "", clusterDistance: 0, searchField: "", mouseHoverField: "name", styleLabelField: "", styleField: "eg_einstufung", name: "Badegewässer"}
        ],
        menubar: true,
        mouseHover: true,
        scaleLine: true,
        isMenubarVisible: false,
        menu: {
            viewerName: "GeoViewer",
            searchBar: true,
            layerTree: true,
            helpButton: false,
            contactButton: true,
            tools: true,
            treeFilter: false,
            wfsFeatureFilter: false,
            legend: true,
            routing: false
        },
        startUpModul: "",
        searchBar: {
            placeholder: "Suche Adresse, Stadtteil",
            gazetteerURL: function () {
                return "/geofos/dog_hh/services/wfs?service=WFS&request=GetFeature&version=2.0.0";
            }
        },
        tools: {
            gfi: true,
            measure: true,
            print: false,
            coord: true,
            draw: false,
            active: "gfi"
        },
        orientation: true,
        poi: false
    };

    return config;
});
