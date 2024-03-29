define(function () {
    var config = {
        wfsImgPath: "../components/lgv-config/img/",
        allowParametricURL: true,
        view: {
            center: [561210, 5932600],
            resolution: 15.874991427504629, // 1:60.000
            scale: 60000, // für print.js benötigt
            extent: [454591, 5809000, 700000, 6075769]
        },
        layerConf: '../components/lgv-config/services-fhhnet.json',
        categoryConf: '../components/lgv-config/category.json',
        styleConf: '../components/lgv-config/style.json',
        print: {
            url: function () {
                    return "http://geoportal-hamburg.de/mapfish_print_2.0/";
                }
            ,
            title: "Verkehrsportal",
            gfi: false
        },
        proxyURL: '/cgi-bin/proxy.cgi',
        layerIDs: [
            {id: '453', visible: true},
            {id: '452', visible: false},
            {id: '2092', visible: false},
            {id:
             [
                 {
                     id: '946',
                     attribution:
                     {
                         eventname: 'aktualisiereverkehrsnetz',
                         timeout: (10 * 60000)
                     }
                 },
                 {
                     id: '947'
                 }
             ],
             name: 'Verkehrslage auf Autobahnen', visible: false
            },
            {id: '1935', visible: false, styles: ['geofox_Faehre', 'geofox-bahn'], name: ["HVV Fährverbindungen", "HVV Bahnlinien"]},
            {id:
             [
                {
                    id: '1935',
                    name: "Bus1"
                },
                {
                    id: '1935',
                    name: "Bus2"
                }
             ],
             visible: false, name: 'HVV Buslinien', styles: ['geofox-bus', 'geofox_BusName']
            },
            {id: '1933', visible: false, styles: 'geofox_stations', name: "HVV Haltestellen"},
            {id: '46', visible: false, style: '46', clusterDistance: 60, searchField: '', mouseHoverField: '', filterOptions: [], routable: true},
            {id: '48', visible: false, style: '48', clusterDistance: 40, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: '', routable: true},
            {id: '50', visible: false, style: '50', clusterDistance: 40, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: '', routable: true},
            {id: '53', visible: false, style: '53', clusterDistance: 40, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: '', routable: true},
            {id: '45', visible: false, style: '45', clusterDistance: 40, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: '', routable: true},
            {id: '51', visible: false, style: '51', clusterDistance: 40, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: '', routable: true},
            {id: '52', visible: false, style: '52', clusterDistance: 30, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: '', styleField: 'situation', routable: true},
            {id: '2128', visible: false, style: '2128', clusterDistance: 0, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: ''},
            {id: '47', visible: false, style: '47', clusterDistance: 0, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: 'id_kost'},
            {id: '2156', visible: true, style: '2156', clusterDistance: 0, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: '', styleField: 'name', routable: false},
            {id: '2119', visible: false, style: '2119', clusterDistance: 0, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: ''},
            {id: '2132', visible: false, style: '2132', clusterDistance: 0, searchField: '', mouseHoverField: '', filterOptions: [], styleLabelField: ''}
        ],
        attributions: true,
        clickCounter: {
            version: '',
            desktop: 'http://static.hamburg.de/countframes/verkehrskarte_count.html',
            mobil : 'http://static.hamburg.de/countframes/verkehrskarte-mobil_count.html'
        },
        menubar: true,
        scaleLine: true,
        mouseHover: false,
        isMenubarVisible: true,
        menu: {
            viewerName: 'GeoViewer',
            searchBar: true,
            layerTree: true,
            helpButton: false,
            contactButton: false,
            tools: true,
            treeFilter: false,
            wfsFeatureFilter: false,
            legend: false,
            routing: true
        },
        startUpModul: '',
        searchBar: {
            placeholder: "Adresssuche",
            gazetteerURL: function () {
                return "/geodienste-hamburg/HH_WFS_DOG?service=WFS&request=GetFeature&version=2.0.0";
            }
        },
        tools: {
            gfi: true,
            measure: true,
            print: false,
            draw: false,
            coord: true,
            active: 'gfi'
        },
        orientation: true,
        poi: true
    }

    return config;
});
