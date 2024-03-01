import Feature from 'ol/Feature'
import GeoJSONFormat, {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
} from 'ol/format/GeoJSON'
import { Geometry } from 'ol/geom'

const formats = {
  geojson: new GeoJSONFormat(),
}

export const createFeatures = (
  features: GeoJSONFeatureCollection,
): Feature[] => {
  return formats.geojson.readFeatures(features)
}

export const createGeoJsonFeature = (
  geometry: Geometry,
  properties: { [x: string]: any },
): GeoJSONFeature => {
  return {
    type: 'Feature',
    properties,
    geometry,
  }
}
