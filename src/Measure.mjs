import { Collection, Feature } from 'ol'
import { doubleClick, noModifierKeys, primaryAction } from 'ol/events/condition'
import { LineString, MultiPoint, Polygon } from 'ol/geom'
import { Point } from 'ol/geom'
import { Draw, Modify, Snap } from 'ol/interaction'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, RegularShape, Stroke, Style, Text } from 'ol/style'
import CircleStyle from 'ol/style/Circle'

import { formatArea, formatLength } from './utilities.mjs'
import { DEFAULT_STYLE } from './defaults.mjs'

export class Measure {
  olly = null
  listener = null
  layer = null
  snap = null
  draw = null
  modify = null
  snapFeatures = new Collection()
  styles = {
    stroke: null,
    fill: null,
    text: null,
    default: null,
    polygonHint: null,
    vertex: null,
    label: null,
    modify: null,
    segment: null,
    segments: [],
  }

  constructor(olly, opts) {
    this.olly = olly
    this.createStyles(opts.style)
    this.init()
  }

  createStyles(styles) {
    styles = { ...DEFAULT_STYLE, ...styles }
    this.styles.stroke = new Stroke({
      color: styles['stroke-color'],
      width: styles['stroke-width'],
    })
    this.styles.fill = new Fill({
      color: styles['fill-color'],
    })
    this.styles.text = new Fill({
      color: styles['text-fill-color'],
    })

    this.styles.default = new Style({
      fill: this.styles.fill,
      stroke: this.styles.stroke,
    })
    this.styles.polygonHint = new Style({
      stroke: new Stroke({
        color: styles['stroke-color'],
        width: 1,
        lineDash: [6, 4],
      }),
    })
    this.styles.vertex = new Style({
      image: new CircleStyle({
        radius: styles['circle-radius'],
        stroke: new Stroke({
          color: styles['circle-stroke-color'],
          width: styles['circle-stroke-width'],
        }),
        fill: new Fill({
          color: styles['circle-fill-color'],
        }),
      }),
    })
    const backgroundFill = new Fill({
      color: styles['text-background-fill-color'],
    })
    this.styles.label = new Style({
      text: new Text({
        font: '14px Calibri,sans-serif',
        fill: this.styles.text,
        backgroundFill: backgroundFill,
        backgroundStroke: new Stroke({
          color: styles['text-background-fill-color'],
          width: 16,
          lineCap: 'round',
          lineJoin: 'round',
        }),
        padding: [3, 3, 3, 3],
        textBaseline: 'bottom',
        offsetY: -22,
      }),
      image: new RegularShape({
        radius: 8,
        points: 3,
        angle: Math.PI,
        displacement: [0, 12],
        fill: backgroundFill,
      }),
    })
    this.styles.modify = new Style({
      image: new CircleStyle({
        radius: styles['circle-radius'],
        stroke: this.styles.stroke,
        fill: this.styles.fill,
      }),
    })
    this.styles.segment = new Style({
      text: new Text({
        font: '12px Calibri,sans-serif',
        fill: this.styles.text,
        placement: 'line',
        textBaseline: 'bottom',
      }),
    })
    this.styles.segments.push(this.styles.segment)
  }

  init() {
    const source = new VectorSource()
    this.layer = new VectorLayer({
      source: source,
      style: (feature) => this.styleFunction(feature),
    })
    this.layer.setMap(this.olly._map)
    this.modify = new Modify({
      source: this.layer.getSource(),
      style: this.styles.modify,
      deleteCondition: (e) => noModifierKeys(e) && doubleClick(e),
    })
    this.draw = new Draw({
      source: this.layer.getSource(),
      type: 'LineString',
      stopClick: true,
      condition: (e) =>
        noModifierKeys(e) && primaryAction(e) && !doubleClick(e),
      style: (feature) => this.drawStyleFunction(feature),
    })
    this.draw.on('drawstart', (e) => {
      this.modify.setActive(false)
      const feature = new Feature(
        new Point(e.feature.getGeometry().getCoordinates()[0]),
      )
      this.snapFeatures.push(feature)
    })
    this.draw.on('drawend', (e) => {
      this.modify.setActive(true)
      const geom = e.feature.getGeometry()
      if (geom.getType() === 'LineString') {
        const coords = geom.getCoordinates()
        const last = coords[coords.length - 1]
        if (
          coords.length > 3 &&
          coords[0][0] === last[0] &&
          coords[0][1] === last[1]
        ) {
          e.feature.setGeometry(new Polygon([coords]))
        }
      }
      this.snapFeatures.push(e.feature)
    })
    this.snap = new Snap({ features: this.snapFeatures })
  }
  start(clb) {
    this.listener = clb
    this.olly._map.addInteraction(this.modify)
    const features = this.olly.getAllFeatures()
    this.snapFeatures.extend(features)
    this.modify.setActive(true)
    this.olly._map.addInteraction(this.draw)
    this.olly._map.addInteraction(this.snap)
  }
  stop() {
    this.olly._map.removeInteraction(this.draw)
    this.olly._map.removeInteraction(this.modify)
    this.olly._map.removeInteraction(this.snap)
    this.snapFeatures.clear()
    this.layer.getSource().clear()
    this.listener = null
  }
  styleFunction(feature) {
    const geometry = feature.getGeometry()
    const type = geometry.getType()
    let point, label, line
    if (type === 'Polygon') {
      point = geometry.getInteriorPoint()
      line = new LineString(geometry.getCoordinates()[0])
      label = `${formatArea(geometry)}\n${formatLength(line)}`
    } else if (type === 'LineString') {
      point = new Point(geometry.getCoordinates()[0])
      label = formatLength(geometry)
      line = geometry
    }
    return this.commonStyleFunction(point, label, line)
  }
  drawStyleFunction(feature) {
    const geometry = feature.getGeometry()
    const type = geometry.getType()
    let point, label, line, polygon
    if (type === 'LineString') {
      point = new Point(geometry.getCoordinates()[0])
      label = formatLength(geometry)
      line = geometry
      if (geometry.getCoordinates().length > 2) {
        const coordinates = [...geometry.getCoordinates()]
        if (coordinates.length > 2) {
          coordinates.push(coordinates[0])
          polygon = new Polygon([coordinates])
        }
      }
    }
    return this.commonStyleFunction(point, label, line, polygon)
  }

  commonStyleFunction(point, label, line, polygon = null) {
    const styles = []
    if (polygon) {
      this.styles.polygonHint.setGeometry(polygon)
      styles.push(this.styles.polygonHint)
    }
    styles.push(this.styles.default)
    if (line) {
      let count = 0
      line.forEachSegment((a, b) => {
        const segment = new LineString([a, b])
        const label = formatLength(segment)
        if (this.styles.segments.length - 1 < count) {
          this.styles.segments.push(this.styles.segment.clone())
        }
        this.styles.segments[count].setGeometry(segment)
        this.styles.segments[count].getText().setText(label)
        styles.push(this.styles.segments[count])
        count++
      })
      const coordinates = line.getCoordinates()
      this.styles.vertex.setGeometry(new MultiPoint(coordinates))
      styles.push(this.styles.vertex)
    }
    if (label && line.getCoordinates().length > 2) {
      this.styles.label.setGeometry(point)
      this.styles.label.getText().setText(label)
      styles.push(this.styles.label)
    }
    return styles
  }
}
