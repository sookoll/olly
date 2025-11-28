import { WMSGetFeatureInfo } from 'ol/format'
import GeoJSONFormat from 'ol/format/GeoJSON'
import WFSFormat from 'ol/format/WFS'
import { getCenter } from 'ol/extent'

export const formats = {
  geojson: new GeoJSONFormat(),
  wms: new WMSGetFeatureInfo(),
  wfs: new WFSFormat(),
}

export const createFeature = (geoJsonFeature) =>
  formats.geojson.readFeature(geoJsonFeature)

export const createFeatures = (
  geoJsonFeatures = [],
  format = 'geojson',
  dataProjection = null,
  featureProjection = null,
) => {
  const collection = {
    type: 'FeatureCollection',
    features: geoJsonFeatures,
  }
  const options = {}
  if (dataProjection) {
    options.dataProjection = dataProjection
  }
  if (featureProjection) {
    options.featureProjection = featureProjection
  }
  return formats[format].readFeatures(collection, options)
}

export const createGeoJsonFeature = (geom, properties = {}) => {
  const geometry = formats.geojson.writeGeometryObject(geom)
  return encodeGeoJsonFeature(geometry, properties)
}

export const encodeGeoJsonFeature = (geometry, properties = {}) => ({
  type: 'Feature',
  properties,
  geometry,
})

export const getBbox = (geoJsonGeom) => {
  const geom = formats.geojson.readGeometry(geoJsonGeom)
  return geom.getExtent()
}

export const getCentroid = (geoJsonGeom) => {
  const bbox = getBbox(geoJsonGeom)
  return getCenter(bbox)
}
