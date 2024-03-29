/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  Revision #1 - September 4, 2014
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|  https://developer.mozilla.org/User:fusionchess
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path[, domain]])
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

define([
    'underscore',
    'backbone'
], function (_, Backbone, EventBus, Config, ol) {

    var cookieModel = Backbone.Model.extend({
        defaults: {
            approved: false
        },
        initialize: function () {
            var pathname = window.location.pathname.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "");
            this.set('sKey', 'lgv_' + pathname);
            this.set('cookieEnabled', navigator.cookieEnabled);
            this.set('approved', this.hasItem()); // wenn schon ein Item existiert, dann wurde schon zugestimmt.
        },
        approval: function () {
            this.set('approved', true);
            this.setItem('');
        },
        refusal: function () {
            this.set('approved', false);
        },
        getItem: function () {
            if (this.get('cookieEnabled') === false || this.get('approved' === false)) {
                return null;
            } else {
                var sKey = this.get('sKey');
                return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
            }
        },
        setItem: function (sValue, vEnd, sPath, sDomain, bSecure) {
            if (this.get('cookieEnabled') === false || this.get('approved' === false)) {
                return false;
            }
            var sKey = this.get('sKey');
            if (/^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
                return false;
            }
            var sExpires = "";
            if (vEnd) {
                switch (vEnd.constructor) {
                    case Number:
                        sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                        break;
                    case String:
                        sExpires = "; expires=" + vEnd;
                        break;
                    case Date:
                        sExpires = "; expires=" + vEnd.toUTCString();
                        break;
                }
            }
            document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
            return true;
        },
        removeItem: function (sPath, sDomain) {
            if (this.get('cookieEnabled') === false || this.get('approved' === false)) {
                return false;
            }
            var sKey = this.get('sKey');
            if (!this.hasItem(sKey)) {
                return false;
            }
            document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
            return true;
        },
        hasItem: function () {
            var sKey = this.get('sKey');
            return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
        },
        keys: function () {
            if (this.get('cookieEnabled') === false || this.get('approved' === false)) {
                return null;
            }
            var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
            for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
            return aKeys;
        }
    });

    return new cookieModel();
});
