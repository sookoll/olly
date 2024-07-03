// Map
export const DEFAULT_TILE = 256
export const MIN_ZOOM = 0
export const MAX_ZOOM = 20
export const MAP_ANIMATION = 250

// Projections
export const DEFAULT_PROJECTIONS = ['EPSG:4326', 'EPSG:3857']
export const DEFAULT_PROJECTION = DEFAULT_PROJECTIONS[1]

export const PROJ_DEFINITIONS = {
  'EPSG:3301': {
    definition:
      '+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    extent: [40500, 5993000, 1064500, 7017000],
    units: 'm',
  },
}

// Layer style
export const DEFAULT_STYLE = {
  'fill-color': 'rgba(255,255,255,0.4)',
  'stroke-color': '#3399CC',
  'stroke-width': 1.25,
  'circle-radius': 5,
  'circle-fill-color': 'rgba(255,255,255,0.4)',
  'circle-stroke-width': 1.25,
  'circle-stroke-color': '#3399CC',
}

export const CLUSTER_DISTANCE = 25
