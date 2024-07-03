import { getCenter } from 'ol/extent'
import { Point } from 'ol/geom'
import {
  addCoordinateTransforms,
  addProjection,
  fromLonLat,
  get,
  toLonLat,
  transform as projTransform,
  transformExtent,
} from 'ol/proj'
import { register } from 'ol/proj/proj4'
import Projection from 'ol/proj/Projection'
import proj4 from 'proj4'

import { DEFAULT_PROJECTIONS, PROJ_DEFINITIONS } from './defaults'

export const getProjection = get
export const coordinateTransforms = addCoordinateTransforms

/**
 * Create and register projection for ol
 *
 * @param projectionName {string}
 * @param definition {string}
 * @param extent {Array<number>}
 * @param units {string}
 * @returns {Projection|null}
 */
export const setProjection = (
  projectionName,
  definition = null,
  extent = [],
  units = null,
) => {
  if (DEFAULT_PROJECTIONS.includes(projectionName)) {
    return getProjection(projectionName)
  }
  const exists = getProjection(projectionName)
  if (exists) {
    return exists
  }
  if (!definition && projectionName in PROJ_DEFINITIONS) {
    definition = PROJ_DEFINITIONS[projectionName].definition
  }
  if (!definition) {
    return null
  }
  if (!extent.length && projectionName in PROJ_DEFINITIONS) {
    extent = PROJ_DEFINITIONS[projectionName].extent
  }
  if (!units && projectionName in PROJ_DEFINITIONS) {
    units = PROJ_DEFINITIONS[projectionName].units
  }

  proj4.defs(projectionName, definition)
  register(proj4)

  const projection = {
    code: projectionName,
  }

  if (extent && extent.length === 4) {
    projection.extent = extent
  }

  if (units) {
    projection.units = units
  }

  return addProj(projection)
}

/**
 * Transforms coordinate or extent from one projection to another
 *
 * @param type {string} one of coordinate, fromLonLat, toLonLat, extent
 * @param input {Coordinate|Extent} coordinate or extent
 * @param proj1 {string} Projection EPSG code
 * @param proj2 {string} Projection EPSG code
 * @returns {Array<number>}
 */
export const transform = (
  type,
  input,
  proj1 = 'EPSG:4326',
  proj2 = 'EPSG:4326',
) => {
  let output

  if (proj1 === proj2) {
    return input
  }

  if (proj1) {
    const proj1Exists = getProjection(proj1)
    if (!proj1Exists) {
      setProjection(proj1)
    }
  }
  if (proj2) {
    const proj2Exists = getProjection(proj2)
    if (!proj2Exists) {
      setProjection(proj2)
    }
  }

  switch (type) {
    case 'coordinate':
      output = projTransform(input, proj1, proj2)
      break
    case 'fromLonLat':
      output = fromLonLat(input, proj1)
      break
    case 'toLonLat':
      output = toLonLat(input, proj1)
      break
    case 'extent':
      output = transformExtent(input, proj1, proj2)
      break
  }

  return output || input
}

/**
 * Transforms coordinate for KML overlay
 *
 * @param coordinate {Coordinate}
 * @param angle {number}
 * @param extent {Extent}
 * @returns {Coordinate}
 */
export const pointRotationTransform = (coordinate, angle, extent) => {
  const point = new Point(coordinate)
  point.rotate(angle, getCenter(extent))

  return point.getCoordinates()
}

/**
 * Add ol projection
 *
 * @param options {Object}
 * @returns {Projection}
 */
export const addProj = (options) => {
  const proj = new Projection(options)
  addProjection(proj)

  return proj
}
