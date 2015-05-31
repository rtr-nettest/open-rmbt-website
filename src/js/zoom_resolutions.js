// These are the resolutions which the zoom levels used in projection
// 900913. A value of x means that a pixels on the map contains x data
// units at that zoom level. 1 data unit is 1m at the equator.
// At zoom level 0, that whole world¹ fits on a 256x256 tile.
// The coordinates stretch from -20037508.34 to 20037508.34 in each
// direction.
// See also http://docs.openlayers.org/library/spherical_mercator.html
//
// 1 data unit at the most Southern point of Austria is ~0.69m, at the
// most Northern point about ~0.65m.
//
// ¹ Due to the projection, locations North or South of the ±85.0511 latitude
//   are not defined.

var zoom_resolutions = [
    156543,03390625,         //  0
     78271,516953125,        //  1
     39135,758476563,        //  2
     19567,879238281,        //  3
      9783,939619141,        //  4
      4891,96980957,         //  5
      2445,984904785,        //  6
      1222,992452393,        //  7
       611.4962261962892,    //  8
       305.7481130981446,    //  9
       152.8740565490723,    // 10
	76.43702827453615,   // 11
	38.21851413726807,   // 12
	19.109257068634037,  // 13
	 9.554628534317018,  // 14
	 4.777314267158509,  // 15
	 2.3886571335792546, // 16
	 1.1943285667896273, // 17
	 0.5971642833948136, // 18
	 0.2985821416974068  // 19
];
