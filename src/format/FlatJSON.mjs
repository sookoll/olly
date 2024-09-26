/**
 * @module ol/format/FlatJSON
 */
import JSONFeature from 'ol/format/JSONFeature'
import GeoJSON from 'ol/format/GeoJSON'
import { get as getProjection } from 'ol/proj'
/**
 * @typedef {import("geojson").GeoJSON} GeoJSONObject
 * @typedef {import("geojson").Feature} GeoJSONFeature
 * @typedef {import("geojson").FeatureCollection} GeoJSONFeatureCollection
 * @typedef {import("geojson").Geometry} GeoJSONGeometry
 * @typedef {import("geojson").Point} GeoJSONPoint
 * @typedef {import("geojson").LineString} GeoJSONLineString
 * @typedef {import("geojson").Polygon} GeoJSONPolygon
 * @typedef {import("geojson").MultiPoint} GeoJSONMultiPoint
 * @typedef {import("geojson").MultiLineString} GeoJSONMultiLineString
 * @typedef {import("geojson").MultiPolygon} GeoJSONMultiPolygon
 * @typedef {import("geojson").GeometryCollection} GeoJSONGeometryCollection
 */

/**
 * @template {import("ol/Feature.js").FeatureLike} [FeatureType=import("ol/Feature.js").default]
 * @typedef {Object} Options
 *
 * @property {import("ol/proj.js").ProjectionLike} [dataProjection='EPSG:4326'] Default data projection.
 * @property {import("ol/proj.js").ProjectionLike} [featureProjection] Projection for features read or
 * written by the format.  Options passed to read or write methods will take precedence.
 * @property {string|Array<string>} [dataGeometryName] Geometry name to use when reading geometry or array of coordinate fields (x, y, z, m).
 * Defaults to "geometry" and if this not present, script will try to guess GeoJSON property
 * @property {string} [dataPrefix] Input data prefix, string from root to array of data items. Use dot notation when nested object.
 * @property {string|Array<string>} [geometryName] Geometry name to use when creating features
 * @property {boolean} [extractGeometryName=false] Certain GeoJSON providers include
 * the geometry_name field in the feature GeoJSON. If set to `true` the GeoJSON reader
 * will look for that field to set the geometry name. If both this field is set to `true`
 * and a `geometryName` is provided, the `geometryName` will take precedence.
 * @property {import('ol/format/Feature.js').FeatureToFeatureClass<FeatureType>} [featureClass] Feature class
 * to be used when reading features. The default is {@link module:ol/Feature~Feature}. If performance is
 * the primary concern, and features are not going to be modified or round-tripped through the format,
 * consider using {@link module:ol/render/Feature~RenderFeature}
 */

const allowedGeometryTypes = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection',
]

/**
 * @classdesc
 * Feature format for reading and writing data in the plain JSON format.
 *
 * @template {import('ol/Feature.js').FeatureLike} [FeatureType=import("ol/Feature.js").default]
 * @extends {JSONFeature<FeatureType>}
 * @api
 */
class FlatJSON extends JSONFeature {
  /**
   * @param {Options<FeatureType>} [options] Options.
   */
  constructor(options) {
    options = options ? options : {}

    super()

    /**
     * @type {import("ol/proj/Projection.js").default}
     */
    this.dataProjection = getProjection(
      options.dataProjection ? options.dataProjection : 'EPSG:4326',
    )

    if (options.featureProjection) {
      /**
       * @type {import("ol/proj/Projection.js").default}
       */
      this.defaultFeatureProjection = getProjection(options.featureProjection)
    }

    if (options.featureClass) {
      this.featureClass = options.featureClass
    }

    /**
     * Name of the geometry attribute for features.
     * @type {string|undefined}
     * @private
     */
    this.geometryName_ = options.geometryName

    /**
     * Look for the `geometry_name` in the feature GeoJSON
     * @type {boolean|undefined}
     * @private
     */
    this.extractGeometryName_ = options.extractGeometryName

    this.geoJSONFormat_ = new GeoJSON(options)
    /**
     * Name of the geometry attribute in input data. In case of array, it can be Point cooedinates (x, y, z, m)
     * @type {string|Array<string>}
     * @private
     */
    this.dataGeometryName_ = options.dataGeometryName
    /**
     * Data collection prefix
     * @type {string|Array<string>}
     * @private
     */
    this.dataPrefix_ = options.dataPrefix
  }

  /**
   * Read feature from object
   * @param {Object} object Object.
   * @param {import("ol/Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {FeatureType|Array<FeatureType>} Feature.
   * @override
   */
  readFeatureFromObject(object, options) {
    let geometryName = this.dataGeometryName_
    // defaults to geometry
    if (
      !geometryName &&
      'geometry' in object &&
      allowedGeometryTypes.includes(object['geometry'].type)
    ) {
      geometryName = 'geometry'
    }
    // try to quess geometry field
    if (!geometryName) {
      geometryName = extractDataGeomNameFromObject(object)
    }

    if (geometryName) {
      const geometry = readGeometryInternal(object, geometryName)
      const properties = { ...object }
      delete properties[geometryName]
      if (geometry) {
        const geoJSONFeature = {
          type: 'Feature',
          geometry: /** @type {GeoJSONGeometry} */ (geometry),
          properties: properties,
        }

        return this.geoJSONFormat_.readFeature(geoJSONFeature, options)
      }
    }

    return null
  }

  /**
   * Read features from object
   * @param {Object} object Object.
   * @param {import("ol/format/Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {Array<FeatureType>} Features.
   * @override
   */
  readFeaturesFromObject(object, options) {
    let featureArray = []
    if (this.dataPrefix_) {
      featureArray = getFrom(object, this.dataPrefix_)
    } else if (Array.isArray(object)) {
      featureArray = object
    }
    const features = []
    for (let i = 0, ii = featureArray.length; i < ii; ++i) {
      const featureObject = this.readFeatureFromObject(featureArray[i], options)
      if (!featureObject) {
        continue
      }
      features.push(featureObject)
    }

    return features
  }

  /**
   * @param {GeoJSONGeometry} object Object.
   * @param {import("ol/format/Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {import("ol/geom/Geometry.js").default} Geometry.
   * @override
   */
  readGeometryFromObject(object, options) {
    return this.geoJSONFormat_.readGeometry(object, options)
  }

  /**
   * @param {Object} object Object.
   * @protected
   * @return {import("ol/proj/Projection.js").default} Projection.
   * @override
   */
  readProjectionFromObject(object) {
    return this.geoJSONFormat_.readProjection(object)
  }

  /**
   * Encode a feature as a GeoJSON Feature object.
   *
   * @param {import("ol/Feature.js").default} feature Feature.
   * @param {import("ol/format/Feature.js").WriteOptions} [options] Write options.
   * @return {GeoJSONFeature} Object.
   * @api
   * @override
   */
  writeFeatureObject(feature, options) {
    return this.geoJSONFormat_.writeFeatureObject(feature, options)
  }

  /**
   * Encode an array of features as a GeoJSON object.
   *
   * @param {Array<import("ol/Feature.js").default>} features Features.
   * @param {import("ol/format/Feature.js").WriteOptions} [options] Write options.
   * @return {GeoJSONFeatureCollection} GeoJSON Object.
   * @api
   * @override
   */
  writeFeaturesObject(features, options) {
    return this.geoJSONFormat_.writeFeaturesObject(features, options)
  }

  /**
   * Encode a geometry as a GeoJSON object.
   *
   * @param {import("../geom/Geometry.js").default} geometry Geometry.
   * @param {import("./Feature.js").WriteOptions} [options] Write options.
   * @return {GeoJSONGeometry|GeoJSONGeometryCollection} Object.
   * @api
   * @override
   */
  writeGeometryObject(geometry, options) {
    return this.geoJSONFormat_.writeGeometryObject(geometry, options)
  }
}

function readGeometryInternal(object, geometryName) {
  if (!object) {
    return null
  }
  let geometry = null
  if (Array.isArray(geometryName)) {
    geometry = {
      type: 'Point',
      coordinates: geometryName
        .map((field) => object[field])
        .filter((value) => value !== undefined),
    }
  } else if (
    geometryName &&
    geometryName in object &&
    typeof object[geometryName] === 'object'
  ) {
    geometry = object[geometryName] || null
  }

  return geometry
}

const getFrom = (object, path) =>
  path.split('.').reduce((r, k) => r?.[k], object)

function extractDataGeomNameFromObject(object) {
  const fields = Object.keys(object)
  for (let i = 0, ii = fields.length; i < ii; ++i) {
    const key = fields[i]
    const value = object[key]
    if (
      value &&
      typeof value === 'object' &&
      'type' in value &&
      allowedGeometryTypes.includes(value.type)
    ) {
      return key
    }
  }

  return null
}

export default FlatJSON
