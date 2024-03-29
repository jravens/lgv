define([
    'underscore',
    'backbone',
    'eventbus',
    'config',
    'openlayers',
    'modules/cookie/view',
    'bootstrap/alert'
], function (_, Backbone, EventBus, Config, ol, cookie) {

    "use strict";
    var GrenznachweisModel = Backbone.Model.extend({
        defaults: {
            nutzungsbedingungakzeptiert: false,
            gebuehrenordnungakzeptiert: false,
            lage: '',
            zweckGebaeudeeinmessung: false,
            zweckGebaeudeabsteckung: false,
            zweckLageplan: false,
            zweckSonstiges: false,
            freitext: '',
            punkte: 'knick-eckpunkte',
            kundenanrede: 'Herr',
            source: new ol.source.Vector(),
            kundenname: '',
            kundenfirma: '',
            kundenadresse: '',
            kundenplz: '',
            kundenort: '',
            kundenemail: '',
            kundenfestnetz: '',
            kundenmobilfunk: '',
            auftragsnummer: '',
            kundennummer: '',
            errors: {},
            activatedInteraction: false,
            weiterButton: {enabled: true, name: 'weiter'},
            zurueckButton: {enabled: false, name: 'zurück'},
            activeDIV: 'beschreibung' //beschreibung oder kundendaten
        },
        initialize: function () {
            EventBus.on("winParams", this.setStatus, this); // Fenstermanagement
            this.set("layer", new ol.layer.Vector({
                source: this.get("source")
            }));
            if (cookie.model.hasItem() === true) {
                this.readCookie();
            }
        },
        setStatus: function (args) {   // Fenstermanagement
            if (args[2] === "grenznachweis") {
                this.set("isCollapsed", args[1]);
                this.set("isCurrentWin", args[0]);
            } else {
                this.set("isCurrentWin", false);
            }
        },
        // Fenstermanagement-Events
        prepWindow: function () {
            if ($('#searchInput') && $('#searchInput').val() != '') {
                this.set('lage', $('#searchInput').val());
            }
        },
        resetWindow: function () {
        },
        // Validation
        validators: {
            minLength: function (value, minLength) {
                return value.length >= minLength;
            },
            maxLength: function (value, maxLength) {
                return value.length <= maxLength;
            },
            maxValue: function (value, maxValue) {
                return value <= maxValue;
            },
            minValue: function (value, minValue) {
                return value >= minValue;
            },
            isLessThan: function (min, max) {
                return min <= max;
            },
            pattern: function (value, pattern) {
                return new RegExp(pattern, "gi").test(value) ? true : false;
            }
        },
        validate: function (attributes, identifier) {
            var errors = {};
            if (identifier.validate === true) {
                if (this.get('activeDIV') === 'kundendaten') {
                    if (attributes.nutzungsbedingungakzeptiert === false) {
                        errors.nutzungsbedingungakzeptiert = "Zustimmung ist obligatorisch.";
                    }
                    if (attributes.gebuehrenordnungakzeptiert === false) {
                        errors.gebuehrenordnungakzeptiert = "Kenntnisnahme ist obligatorisch.";
                    }
                    if (attributes.kundennummer !== '') {
                        if (this.validators.pattern(attributes.kundennummer, '[^0-9\]') === true || attributes.kundennummer.length !== 6) {
                            errors.kundennummer = "Numerischer Wert der Länge 6 erwartet.";
                        }
                    }
                    if (this.validators.minLength(attributes.kundenname, 3) === false) {
                        errors.kundenname = "Name notwendig.";
                    }
                    if (this.validators.minLength(attributes.kundenadresse, 3) === false) {
                        errors.kundenadresse = "Adressangabe notwendig.";
                    }
                    if (this.validators.pattern(attributes.kundenplz, '[^0-9\]') === true || attributes.kundenplz.length !== 5) {
                        errors.kundenplz = "Numerischer Wert der Länge 5 erwartet.";
                    }
                    if (this.validators.minLength(attributes.kundenemail, 1) === false || attributes.kundenemail.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/igm) === null) {
                        errors.kundenemail = "Syntax inkorrekt.";
                    }
                    if (this.validators.pattern(attributes.kundenort, '[0-9\]') === true || this.validators.minLength(attributes.kundenort, 3) === false) {
                        errors.kundenort = "Alphanumerischer Wert erwartet.";
                    }
                    if (this.get('kundenanrede') === 'Firma') {
                        if (this.validators.minLength(attributes.kundenfirma , 2) === false) {
                            errors.kundenfirma = "Firmenname erwartet.";
                        }
                    }
                    // Bei Kundendaten werden auch Bestelldaten rudimentär geprüft, weil diese nach erfolgreicher Übermittlung gelöscht werden und so eine Doppelbestellung mit leeren Werten möglich wäre.
                    if (this.get('source').getFeatures().length === 0 || this.validators.minLength(attributes.lage, 3) === false) {
                        errors.bestelldaten = "Gehen Sie zurück, um neue Bestelldaten einzugeben.";
                    }
                } else {
                    if (this.validators.maxLength(attributes.auftragsnummer, 12) === false) {
                        errors.auftragsnummer = "Maximallänge 12 Zeichen überschritten";
                    }
                    if (this.validators.minLength(attributes.lage, 3) === false) {
                        errors.lage = "Lagebeschreibung notwendig";
                    }
                    if (attributes.zweckGebaeudeeinmessung === false && attributes.zweckGebaeudeabsteckung === false && attributes.zweckLageplan === false && attributes.zweckSonstiges === false) {
                        errors.zweck = "Min. ein Feld muss markiert sein.";
                    }
                    if (this.get('source').getFeatures().length === 0 || this.get('activatedInteraction') === true) {
                        errors.source = "Umringe erfassen und beenden.";
                    }
                }
            } else {
                if (identifier.validate === 'lage') {
                    if (this.validators.minLength(attributes.lage, 3) === false) {
                        errors.lage = "Lagebeschreibung notwendig";
                    }
                }
                if (identifier.validate === 'zweck') {
                    if (attributes.zweckGebaeudeeinmessung === false && attributes.zweckGebaeudeabsteckung === false && attributes.zweckLageplan === false && attributes.zweckSonstiges === false) {
                        errors.zweck = "Min. ein Feld muss markiert sein.";
                    }
                }
                if (identifier.validate === 'kundennummer') {
                    if (attributes.kundennummer !== '') {
                        if (this.validators.pattern(attributes.kundennummer, '[^0-9\]') === true || attributes.kundennummer.length !== 6) {
                            errors.kundennummer = "Numerischer Wert der Länge 6 erwartet.";
                        }
                    }
                }
                if (identifier.validate === 'kundenname1') {
                    if (this.validators.pattern(attributes.kundenname, '[0-9\]') === true) {
                        errors.kundenname = "Alphanumerischer Wert erwartet.";
                    }
                }
                if (identifier.validate === 'kundenname2' || identifier.validate === true) {
                    if (this.validators.minLength(attributes.kundenname, 3) === false) {
                        errors.kundenname = "Name notwendig.";
                    }
                }
                if (identifier.validate === 'kundenadresse' || identifier.validate === true) {
                    if (this.validators.minLength(attributes.kundenadresse, 3) === false) {
                        errors.kundenadresse = "Adressangabe notwendig.";
                    }
                }
                if (identifier.validate === 'kundenplz' || identifier.validate === true) {
                    if (this.validators.pattern(attributes.kundenplz, '[^0-9\]') === true || attributes.kundenplz.length !== 5) {
                        errors.kundenplz = "Numerischer Wert der Länge 5 erwartet.";
                    }
                }
                if (identifier.validate === 'kundenort' || identifier.validate === true) {
                    if (this.validators.pattern(attributes.kundenort, '[0-9\]') === true || this.validators.minLength(attributes.kundenort, 3) === false) {
                        errors.kundenort = "Alphanumerischer Wert erwartet.";
                    }
                }
                if (identifier.validate === 'kundenemail' || identifier.validate === true) {
                    if (attributes.kundenemail.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/igm) === null) {
                        errors.kundenemail = "Syntax inkorrekt.";
                    }
                }
                if (identifier.validate === 'kundenfestnetz' || identifier.validate === true) {
                    if (this.validators.pattern(attributes.kundenfestnetz, '[^0-9\-/]') === true) {
                        errors.kundenfestnetz = "Numerischer Wert erwartet.";
                    }
                }
                if (identifier.validate === 'kundenmobilfunk' || identifier.validate === true) {
                    if (this.validators.pattern(attributes.kundenmobilfunk, '[^0-9\-/]') === true) {
                        errors.kundenmobilfunk = "Numerischer Wert erwartet.";
                    }
                }
            }
            // return die Errors
            this.set("errors", errors);
            if (_.isEmpty(errors) === false) {
                return errors;
            }
        },
        // anonymisierte Events
        focusout: function (evt) {
            if (evt.target.id === 'lagebeschreibung') {
                this.set('lage', evt.target.value, {validate: 'lage'});
            } else if (evt.target.id === 'kundennummer') {
                this.set('kundennummer', evt.target.value, {validate: 'kundennummer'});
            } else if (evt.target.id === 'kundenname') {
                this.set('kundenname', evt.target.value, {validate: 'kundenname2'});
            } else if (evt.target.id === 'kundenadresse') {
                this.set('kundenadresse', evt.target.value, {validate: 'kundenadresse'});
            } else if (evt.target.id === 'kundenplz') {
                this.set('kundenplz', evt.target.value, {validate: 'kundenplz'});
            } else if (evt.target.id === 'kundenort') {
                this.set('kundenort', evt.target.value, {validate: 'kundenort'});
            } else if (evt.target.id === 'kundenemail') {
                this.set('kundenemail', evt.target.value, {validate: 'kundenemail'});
            }
        },
        keyup: function (evt) {
            if (evt.target.id === 'lagebeschreibung') {
                this.set('lage', evt.target.value);
            } else if (evt.target.id === 'auftragsnummer') {
                this.set('auftragsnummer', evt.target.value, {validate: 'auftragsnummer'});
            } else if (evt.target.id === 'kundennummer') {
                this.set('kundennummer', evt.target.value);
            } else if (evt.target.id === 'freitext') {
                this.set('freitext', evt.target.value);
            } else if (evt.target.id === 'kundenname') {
                this.set('kundenname', evt.target.value, {validate: 'kundenname1'});
            } else if (evt.target.id === 'kundenfirma') {
                this.set('kundenfirma', evt.target.value);
            } else if (evt.target.id === 'kundenadresse') {
                this.set('kundenadresse', evt.target.value);
            } else if (evt.target.id === 'kundenplz') {
                this.set('kundenplz', evt.target.value);
            } else if (evt.target.id === 'kundenort') {
                this.set('kundenort', evt.target.value);
            } else if (evt.target.id === 'kundenemail') {
                // nutze lieber focusout
            } else if (evt.target.id === 'kundenfestnetz') {
                this.set('kundenfestnetz', evt.target.value, {validate: 'kundenfestnetz'});
            } else if (evt.target.id === 'kundenmobilfunk') {
                this.set('kundenmobilfunk', evt.target.value, {validate: 'kundenmobilfunk'});
            }
        },
        click: function (evt) {
            if (evt.target.id === 'zweckGebaeudeeinmessung') {
                this.set('zweckGebaeudeeinmessung', evt.target.checked, {validate: 'zweck'});
            } else if (evt.target.id === 'zweckGebaeudeabsteckung') {
                this.set('zweckGebaeudeabsteckung', evt.target.checked, {validate: 'zweck'});
            } else if (evt.target.id === 'zweckLageplan') {
                this.set('zweckLageplan', evt.target.checked, {validate: 'zweck'});
            } else if (evt.target.id === 'zweckSonstiges') {
                this.set('zweckSonstiges', evt.target.checked, {validate: 'zweck'});
            } else if (evt.target.id === 'weiter') {
                this.changeZurueckButton(true, 'zurück');
                if (this.get('activeDIV') === 'beschreibung') {
                    this.checkInputBestelldaten();
                } else if (this.get('activeDIV') === 'kundendaten') {
                    this.checkInputKundendaten();
                }
            } else if (evt.target.id === 'zurueck') {
                if (this.get('activeDIV') === 'kundendaten') {
                    this.changeWeiterButton(true, 'weiter');
                    this.set('activeDIV', 'beschreibung');
                    this.changeZurueckButton(false, 'zurück');
                    this.trigger('render');
                }
            } else if (evt.target.id === 'setgeometrie') {
                this.toggleDrawInteraction();
            } else if (evt.target.id === 'removegeometrie') {
                this.removeAllGeometries();
            } else if (evt.target.id === 'anredeherr' || evt.target.id === 'anredefrau' || evt.target.id === 'anredefirma') {
                $("#anrede1").removeClass('active');
                $("#anrede2").removeClass('active');
                $("#anrede3").removeClass('active');
                $("#" + evt.target.parentElement.id).addClass('active');
                this.set('kundenanrede', evt.target.textContent);
                this.trigger('render');
            } else if (evt.target.id === 'nutzungsbedingungen') {
                if (evt.target.checked === true) {
                    $('#nutzungsbedingungentext').removeClass('alert-danger');
                } else {
                    $('#nutzungsbedingungentext').addClass('alert-danger');
                }
                this.set('nutzungsbedingungakzeptiert', evt.target.checked);
            } else if (evt.target.id === 'gebuehrenordnung') {
                if (evt.target.checked === true) {
                    $('#gebuehrenordnungtext').removeClass('alert-danger');
                } else {
                    $('#gebuehrenordnungtext').addClass('alert-danger');
                }
                this.set('gebuehrenordnungakzeptiert', evt.target.checked);
            }
        },
        changeWeiterButton: function (enabled, name) {
            this.set('weiterButton', {enabled: enabled, name: name});
        },
        changeZurueckButton: function (enabled, name) {
            this.set('zurueckButton', {enabled: enabled, name: name});
        },
        checkInputKundendaten: function () {
            var checker = this.isValid({validate: true});
            if (checker === true) {
                this.writeCookie();
                this.transmitOrder();
            }
        },
        checkInputBestelldaten: function () {
            var checker = this.isValid();
            if (checker === true) {
                this.set('activeDIV', 'kundendaten');
                this.changeWeiterButton(true, 'Gebührenpflichtig bestellen');
                this.trigger('render');
            }
        },
        transmitOrder: function () {
            // kopiere Attributwerte in für den FME-Prozess taugliche Form
            var zweckGebaeudeeinmessung, zweckGebaeudeabsteckung, zweckLageplan, zweckSonstiges, request_str, url;
            if (this.get('zweckGebaeudeeinmessung') === true) {
                zweckGebaeudeeinmessung = 'ja';
            } else {
                zweckGebaeudeeinmessung = 'nein';
            }
            if (this.get('zweckGebaeudeabsteckung') === true) {
                zweckGebaeudeabsteckung = 'ja';
            } else {
                zweckGebaeudeabsteckung = 'nein';
            }
            if (this.get('zweckLageplan') === true) {
                zweckLageplan = 'ja';
            } else {
                zweckLageplan = 'nein';
            }
            if (this.get('zweckSonstiges') === true) {
                zweckSonstiges = 'ja';
            } else {
                zweckSonstiges = 'nein';
            }
            // hier wird der request zusammengesetzt
            request_str = '<wps:Execute xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ows="http://www.opengis.net/ows/1.1" service="WPS" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd">';
            request_str += '<ows:Identifier>grenznachweis_communicator.fmw</ows:Identifier>';
            request_str += '  <wps:DataInputs>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>auftragsnummer</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('auftragsnummer') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>lagebeschreibung</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('lage') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>zweck_gebaeudeeinmessung</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + zweckGebaeudeeinmessung + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>zweck_gebaeudeabstckung</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + zweckGebaeudeabsteckung + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>zweck_lageplan</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + zweckLageplan + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>zweck_sonstiges</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + zweckSonstiges + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>freitext</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('freitext') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>kundennummer</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundennummer') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>anrede</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundenanrede') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>name</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundenname') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>firma</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundenfirma') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>adresse</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundenadresse') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>plz</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundenplz') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>ort</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundenort') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input><wps:Input>';
            request_str += '    <ows:Identifier>email</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundenemail') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>festnetz</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundenfestnetz') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>mobilfunk</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.get('kundenmobilfunk') + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '  <wps:Input>';
            request_str += '    <ows:Identifier>geometrien</ows:Identifier>';
            request_str += '    <wps:Data>';
            request_str += '      <wps:LiteralData dataType="string">' + this.buildJSONGeom() + '</wps:LiteralData>';
            request_str += '    </wps:Data>';
            request_str += '  </wps:Input>';
            request_str += '</wps:DataInputs>';
            request_str += '</wps:Execute>';
            if (Config.layerConf.indexOf('fhhnet') > -1) {
                url = '/geofos/deegree-wps/services/wps';
            } else {
                url = '/gateway-hamburg/OGCFassade/HH_WPS.aspx';
            }
            $.ajax({
                url: url + '?Request=Execute&Service=WPS&Version=1.0.0&Identifier=grenznachweis_communicator.fmw',
                data: request_str,
                headers: {
                    "Content-Type": "text/xml; charset=UTF-8"
                },
                context: this,
                method: "POST",
                success: function (data, status) {
                    //Unicherheit, wie getElementsByTagName auf allen Browsern arbeitet. Mit Opera, IE klappt es so. Deshalb Fehlermeldung nur wenn es sicher ist.
                    if (data.getElementsByTagName('jobStatus') !== undefined && data.getElementsByTagName('jobStatus')[0].textContent === 'FME_FAILURE') {
                        this.showErrorMessage();
                    } else {
                        this.showSuccessMessage();
                        this.set('auftragsnummer', '');
                        this.set('lage', '');
                        this.set('freitext', '');
                        this.removeAllGeometries();
                    }
                    EventBus.trigger('collapseWindow', this);
                    $("#loader").hide();
                },
                error: function (data, jqXHR) {
                    $("#loader").hide();
                    EventBus.trigger('collapseWindow', this);
                    this.showErrorMessage();
                }
            });
            $('#loader').show();
        },
        showErrorMessage: function () {
            var div = '<div class="alert alert-danger alert-dismissible" role="alert" style="position: absolute; left: 25%; bottom: 50%;width: 50%;"><button type="button" class="close" data-dismiss="alert"  aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Ihr Auftrag wurde leider nicht übermittelt.</strong> Bitte versuchen Sie es später erneut.</div>';
            $("body").append(div);
        },
        showSuccessMessage: function () {
            var ergMsg, div;
            if (this.get('auftragsnummer') !== '') {
                ergMsg = 'mit der Auftragsnummer: ' + this.get('auftragsnummer') + ' ';
            } else {
                ergMsg = '';
            }
            div = '<div class="alert alert-success alert-dismissible" role="alert" style="position: absolute; left: 25%; bottom: 50%;width: 50%;"><button type="button" class="close" data-dismiss="alert"  aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Ihre Bestellung ' + ergMsg + 'wurde an unser Funktionspostfach übermittelt.</strong> Die Bearbeitungsdauer wird ca. ein bis drei Werktage betragen. Für telefonische Rückfragen steht Ihnen die Nummer (040) 42826-5204 von Montag bis Freitag (8:00-13:00) zur Verfügung. Wir danken für Ihren Auftrag!</div>';
            $("body").append(div);
        },
        buildJSONGeom: function () {
            var featurearray = [];
            _.each(this.get('source').getFeatures(), function (item, index, array) {
                var geom, feature;
                geom = item.getGeometry();
                feature = {
                    type: geom.getType(),
                    index: index,
                    coordinates: geom.getCoordinates()
                };
                featurearray.push(feature);
            });
            return JSON.stringify(featurearray);
        },
        readCookie: function () {
            var pCookie = JSON.parse(cookie.model.getItem());
            if (pCookie !== null) {
                this.set('kundennummer', pCookie.kundennummer);
                this.set('kundenanrede', pCookie.kundenanrede);
                this.set('kundenname', pCookie.kundenname);
                this.set('kundenfirma', pCookie.kundenfirma);
                this.set('kundenadresse', pCookie.kundenadresse);
                this.set('kundenplz', pCookie.kundenplz);
                this.set('kundenort', pCookie.kundenort);
                this.set('kundenemail', pCookie.kundenemail);
                this.set('kundenfestnetz', pCookie.kundenfestnetz);
                this.set('kundenmobilfunk', pCookie.kundenmobilfunk);
            }
        },
        writeCookie: function () {
            if (cookie.model.get('approved') === true) {
                // schreibe cookie
                var newCookie = {};
                newCookie.kundennummer = this.get('kundennummer');
                newCookie.kundenanrede = this.get('kundenanrede');
                newCookie.kundenname = this.get('kundenname');
                newCookie.kundenfirma = this.get('kundenfirma');
                newCookie.kundenadresse = this.get('kundenadresse');
                newCookie.kundenplz = this.get('kundenplz');
                newCookie.kundenort = this.get('kundenort');
                newCookie.kundenemail = this.get('kundenemail');
                newCookie.kundenfestnetz = this.get('kundenfestnetz');
                newCookie.kundenmobilfunk = this.get('kundenmobilfunk');
                cookie.model.setItem(JSON.stringify(newCookie), Infinity);
            }
        },
        toggleDrawInteraction: function () {
            if (this.get('activatedInteraction') === false) {
                EventBus.trigger("addLayer", this.get("layer"));
                this.set('draw', new ol.interaction.Draw({
                    source: this.get('source'),
                    type: 'Polygon',
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'orange',
                            width: 2
                        })
                    })
                }));
                this.get("draw").on("drawend", function (evt) {
                    evt.feature.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'green',
                            width: 2
                        })
                    }));
                }, this);
                EventBus.trigger("addInteraction", this.get("draw"));
                this.set('activatedInteraction', true);
            } else {
                EventBus.trigger("removeInteraction", this.get("draw"));
                this.set('activatedInteraction', false);
                this.sourcechanged();
            }
            this.trigger('render');
        },
        removeAllGeometries: function () {
            // lösche alle Geometrien
            this.get("source").clear();
            EventBus.trigger("removeLayer", this.get("layer"));
            this.sourcechanged();
        },
        sourcechanged: function () {
            if (this.get('source').getFeatures().length > 0) {
                $("#removegeometrie").removeAttr('disabled');
                $("#setgeometrie").removeClass('btn-primary');
                $("#setgeometrie").addClass('btn-default');
            } else {
                $("#removegeometrie").prop('disabled', true);
                $("#setgeometrie").removeClass('btn-default');
                $("#setgeometrie").addClass('btn-primary');
            }
        }
    });

    return new GrenznachweisModel();
});
