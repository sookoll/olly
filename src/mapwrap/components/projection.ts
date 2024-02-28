import proj4 from 'proj4'
import { get, fromLonLat, toLonLat, addProjection, transformExtent, transform as projTransform } from 'ol/proj'
import { register } from 'ol/proj/proj4'
import Projection, { Options } from 'ol/proj/Projection'
import { Units } from 'ol/proj/Units'
import { Coordinate } from 'ol/coordinate'
import { Extent, getCenter } from 'ol/extent'
import {Point} from 'ol/geom'

export interface ProjDefinition {
  [key: string]: {
    definition: string,
    extent: Extent,
    units: Units
  }
}

export enum TransformationType {
  coordinate = 'coordinate',
  fromLonLat = 'fromLonLat',
  toLonLat = 'toLonLat',
  extent = 'extent'
}

export const DEFAULT_PROJECTIONS: string[] = ['EPSG:4326', 'EPSG:3857']
export const DEFAULT_PROJECTION: string = DEFAULT_PROJECTIONS[1]

export const PROJ_DEFINITIONS: ProjDefinition = {
  'EPSG:3301': {
      definition: '+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
      extent: [40500, 5993000, 1064500, 7017000],
      units: 'm'
  }
}

export const getProjection = get

export const setProjection = (projectionName: string, definition: string | null = null, extent: Extent = [], units: Units | null = null): Projection | null => {
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

  const projection: Options = {
      code: projectionName
  }

  if (extent && extent.length === 4) {
      projection.extent = extent
  }

  if (units) {
      projection.units = units
  }

  return addProj(projection)
}

export const transform = (type: TransformationType, input: Coordinate | Extent, proj1: string = 'EPSG:4326', proj2: string = 'EPSG:4326') => {
  let output: Coordinate | Extent

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
      case TransformationType.coordinate:
          output = projTransform(input, proj1, proj2)
          break
      case TransformationType.fromLonLat:
          output = fromLonLat(input, proj1)
          break
      case TransformationType.toLonLat:
          output = toLonLat(input, proj1)
          break
      case TransformationType.extent:
          output = transformExtent(input, proj1, proj2)
          break
  }

  return output || input
}

export const pointRotationTransform = (coordinate: Coordinate, angle: number, extent: Extent) => {
  const point = new Point(coordinate)
  point.rotate(angle, getCenter(extent))
  return point.getCoordinates()
}

const addProj = (options: Options): Projection => {
  const proj = new Projection(options)
  addProjection(proj)

  return proj
}