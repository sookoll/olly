import { getArea, getLength } from 'ol/sphere'

import { transform } from './projection'

/**
 * Generate array of numbers from start to end
 *
 * @param start {number}
 * @param end {number}
 * @returns {number[]}
 */
export const range = (start, end) => {
  const inc = (end - start) / Math.abs(end - start)
  return Array.from(Array(Math.abs(end - start) + 1), (_, i) => start + i * inc)
}

/**
 * Simple hash generator
 *
 * @returns {string}
 */
export const uid = () => {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * Simple deep copy
 *
 * @param json
 * @returns {any}
 */
export function deepCopy(json) {
  return JSON.parse(JSON.stringify(json))
}

/**
 * Convert radians to degrees
 *
 * @param rad {number}
 * @returns {number}
 */
export function radToDeg(rad) {
  return (rad * 360) / (Math.PI * 2)
}

/**
 * Convert degrees to radians
 *
 * @param deg {number}
 * @returns {number}
 */
export function degToRad(deg) {
  return (deg * Math.PI * 2) / 360
}

/**
 * Calculate bearing
 *
 * @param from {number[]}
 * @param to {number[]}
 * @returns {number}
 */
export const getBearing = (from, to) => {
  let angle = radToDeg(Math.atan2(to[0] - from[0], to[1] - from[1]))
  if (angle < 0) {
    angle = 360 + angle
  }
  return angle
}

/**
 * Calculate new position from start coordinate with angle and distance
 *
 * @param coord {number[]}
 * @param bearing {number}
 * @param distance {number}
 * @param crs {string}
 * @returns {number[]|Array<number>}
 */
export const getCoordinateByAngleDistance = (
  coord,
  bearing,
  distance,
  crs = 'EPSG: 4326',
) => {
  // distance in KM, bearing in degrees
  const R = 6378137
  const lonlat =
    crs === 'EPSG: 4326' ? coord : transform('toLonLat', coord, crs)
  const brng = degToRad(bearing)
  let lat = degToRad(lonlat[1])
  let lon = degToRad(lonlat[0])
  // Do the math magic
  lat = Math.asin(
    Math.sin(lat) * Math.cos(distance / R) +
      Math.cos(lat) * Math.sin(distance / R) * Math.cos(brng),
  )
  lon += Math.atan2(
    Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat),
    Math.cos(distance / R) - Math.sin(lat) * Math.sin(lat),
  )

  // Coords back to degrees and return
  return crs === 'EPSG: 4326'
    ? [radToDeg(lon), radToDeg(lat)]
    : transform('fromLonLat', [radToDeg(lon), radToDeg(lat)], crs)
}

/**
 * Calculate distance between two coordinates in coordinates units
 *
 * @param coord1 {number[]}
 * @param coord2 {number[]}
 * @returns {number}
 */
export const getCoordinatesDistance = (coord1, coord2) => {
  const a = Math.abs(coord1[0] - coord2[0])
  const b = Math.abs(coord1[1] - coord2[1])

  return Math.sqrt(a * a + b * b)
}

/**
 * Format length
 * @param line
 * @returns {string}
 */
export const formatLength = function (line) {
  const length = getLength(line)
  let output
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + ' km'
  } else {
    output = Math.round(length * 100) / 100 + ' m'
  }
  return output
}

/**
 * Format area
 * @param polygon
 * @returns {string}
 */
export const formatArea = function (polygon) {
  const area = getArea(polygon)
  let output
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2'
  } else {
    output = Math.round(area * 100) / 100 + ' m\xB2'
  }
  return output
}
