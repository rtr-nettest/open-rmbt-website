OpenLayers.Layer.CloudMade = OpenLayers.Class(OpenLayers.Layer.XYZ, {
    initialize: function(name, options) {
		if (!options.key) {
			throw "Please provide key property in options (your API key).";
		}
        options = OpenLayers.Util.extend({
            attribution: "&copy; 2009 <a href='http://cloudmade.com'>CloudMade</a> – Map data &copy; <a href='http://creativecommons.org/licenses/by-sa/2.0'>CC BY-SA</a> <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
            maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
            maxResolution: 156543.0339,
            units: "m",
            projection: "EPSG:900913",
            sphericalMercator: true,
            isBaseLayer: true,
            numZoomLevels: 19,
            displayOutsideMaxExtent: true,
            wrapDateLine: true,
            styleId: 1
        }, options);
		var prefix = [options.key, options.styleId, 256].join('/') + '/';
        var url = [
            "https://d1qte70nkdppk5.cloudfront.net/" + prefix
        ];
        var newArguments = [name, url, options];
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this, newArguments);
    },

    getURL: function (bounds) {
        var res = this.map.getResolution();
        var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
        var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
        var z = this.map.getZoom();
        var limit = Math.pow(2, z);

        if (y < 0 || y >= limit)
        {
            return "../lib/empty-tile.png";
        }
        else
        {
            x = ((x % limit) + limit) % limit;

            var url = this.url;
            var path = z + "/" + x + "/" + y + ".png";

            if (url instanceof Array)
            {
                url = this.selectUrl(path, url);
            }

            return url + path;
        }
    },

    CLASS_NAME: "OpenLayers.Layer.CloudMade"
});
