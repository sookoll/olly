import GeoJSONFormat from 'ol/format/GeoJSON'

export const formats = {
  geojson: new GeoJSONFormat(),
}

export const createFeature = (geoJsonFeature) =>
  formats.geojson.readFeature(geoJsonFeature)

export const createFeatures = (geoJsonFeatures = []) =>
  formats.geojson.readFeatures({
    type: 'FeatureCollection',
    features: geoJsonFeatures,
  })

export const createGeoJsonFeature = (geom, properties) => {
  const geometry = formats.geojson.writeGeometryObject(geom)
  return {
    type: 'Feature',
    properties,
    geometry,
  }
}
