import { Map, Overlay, View } from 'ol'
import { ScaleLine } from 'ol/control'
import { platformModifierKeyOnly } from 'ol/events/condition'
import {
  defaults as defaultInteractions,
  DragPan,
  MouseWheelZoom,
} from 'ol/interaction'

import {
  DEFAULT_PROJECTION,
  MAP_ANIMATION,
  MAX_ZOOM,
  MIN_ZOOM,
} from './defaults.mjs'
import { exportMapCanvas } from './export.mjs'
import { createLayer } from './layer.mjs'
import { Measure } from './Measure.mjs'
import { setProjection, transform } from './projection.mjs'

export class Olly {
  options = null
  _projection = null
  _map = null
  _view = null
  _layers = {
    base: null,
    info: null,
    over: null,
  }
  _listeners = {
    pointermove: [],
    singleclick: [],
    layeradded: [],
    layerremoved: [],
  }
  _measure = null
  pop = null

  constructor(options) {
    const defaults = {
      projection: DEFAULT_PROJECTION,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      target: null,
      enableRotation: false,
      twoFingerPanZoom: false,
      padding: [0, 0, 0, 0],
    }
    this.options = {
      ...defaults,
      ...options,
    }
  }

  async ready() {
    this._layers = await this.createSystemLayers()
    this.projection(this.options.projection)
      .map(this.options.target)
      .interactions(this.options.twoFingerPanZoom)
      .view({
        minZoom: this.options.minZoom,
        maxZoom: this.options.maxZoom,
        enableRotation: this.options.enableRotation,
        padding: this.options.padding,
      })
      .start()

    return this
  }

  projection(projection) {
    this._projection = setProjection(projection)
    if (this._projection && this._map && this._view) {
      const viewProps = this._view.getProperties()
      const currentProj = this._view.getProjection()
      if (viewProps.center) {
        viewProps.center = transform(
          'coordinate',
          viewProps.center,
          currentProj.getCode(),
          this._projection.getCode(),
        )
      }
      this.view(viewProps)
    }
    return this
  }

  map(target = null) {
    this._map = new Map({
      target,
      layers: Object.values(this._layers),
      controls: [],
      interactions: [],
      moveTolerance: 2,
    })

    return this
  }

  view(props) {
    const viewProps = {
      projection: this._projection,
    }
    if (props.extent) {
      viewProps.showFullExtent = true
    }
    this._view = new View({
      ...props,
      ...viewProps,
    })
    this._map.setView(this._view)

    return this
  }

  interactions(twoFingerPanZoom = false) {
    const interactions = twoFingerPanZoom
      ? defaultInteractions({ dragPan: false, mouseWheelZoom: false }).extend([
          new DragPan({
            condition: platformModifierKeyOnly,
          }),
          new MouseWheelZoom({
            condition: platformModifierKeyOnly,
          }),
        ])
      : defaultInteractions()

    if (this._map) {
      this._map.getInteractions().extend(interactions.getArray())
    }

    return this
  }

  render(target = null) {
    if (this._map) {
      this._map.setTarget(target)
    }

    return this
  }

  padding(pads) {
    if (this._view && pads) {
      const center = this._view.getCenter()
      this._view.padding = pads
      if (center) {
        this.animate({ center })
      }
    }

    return this
  }

  getView() {
    return {
      center: this._view.getCenter(),
      zoom: this._view.getZoom(),
      rotation: this._view.getRotation(),
      extent: this._view.calculateExtent(this._map.getSize()),
    }
  }

  center(center = [0, 0], animate = false) {
    if (this._view) {
      if (animate) {
        this.animate({ center })
      } else {
        this._view.setCenter(center)
      }
    }

    return this
  }

  zoom(zoom = 0, animate = false) {
    if (this._view) {
      if (animate) {
        this.animate({ zoom })
      } else {
        this._view.setZoom(zoom)
      }
    }

    return this
  }

  zoomIn() {
    if (this._view) {
      const zoom = this._view.getZoom()
      if (zoom !== undefined) {
        this.zoom(zoom + 1, true)
      }
    }

    return this
  }

  zoomOut() {
    if (this._view) {
      const zoom = this._view.getZoom()
      if (zoom !== undefined) {
        this.zoom(zoom - 1, true)
      }
    }

    return this
  }

  fitTo(bbox = []) {
    if (this._view && bbox.length && bbox.length === 4) {
      this._view.fit(bbox, {
        maxZoom: this._view.getMaxZoom(),
        duration: MAP_ANIMATION,
      })
    }

    return this
  }

  fitToLayer(layer) {
    let bbox = []
    if (typeof layer.getSource().getExtent !== 'undefined') {
      bbox = layer.getSource().getExtent()
    } else {
      bbox = layer.getExtent()
    }

    return this.fitTo(bbox)
  }

  fitToSource(source) {
    let bbox = []
    if (typeof source.getExtent !== 'undefined') {
      bbox = source.getExtent()
    }

    return this.fitTo(bbox)
  }

  animate(opts) {
    if (this._view && opts) {
      this._view.animate({ duration: MAP_ANIMATION, ...opts })
    }

    return this
  }

  async layer(definition) {
    if (!definition || !definition.type) {
      return null
    }
    if (this._projection) {
      definition.mapProjection = this._projection.getCode()
    }
    return await createLayer(definition)
  }

  async createSystemLayers() {
    return {
      base: await this.layer({ type: 'Group' }),
      info: await this.layer({ type: 'Group' }),
      over: await this.layer({ type: 'Group' }),
    }
  }

  baseLayer(layer, active) {
    if (active) {
      this.toggleLayers('base')
    }
    if (layer) {
      layer.setVisible(active)
      layer.setZIndex(0)
      this.getLayers('base').push(layer)
      this.fire('layeradded', {
        type: 'base',
        layers: [layer],
      })
    }

    return this
  }

  infoLayer(layer) {
    this.getLayers('info').push(layer)
    this.fire('layeradded', {
      type: 'info',
      layers: [layer],
    })

    return this
  }

  overLayer(layer) {
    this.getLayers('over').push(layer)
    this.fire('layeradded', {
      type: 'over',
      layers: [layer],
    })

    return this
  }

  changeBaseLayer(id) {
    this.toggleLayers('base')
    const layer = this.getLayersArray('base').find(
      (layer) => layer.get('id') === id,
    )
    if (layer) {
      layer.setVisible(true)
    }

    return this
  }

  getLayers(group) {
    if (group in this._layers) {
      return this._layers[group].getLayers()
    }

    return undefined
  }

  getLayersArray(group) {
    if (group in this._layers) {
      return this.getLayers(group).getArray()
    }

    return undefined
  }

  findLayer(group, id) {
    if (group in this._layers && id) {
      return this.getLayersArray(group).find((layer) => layer.get('id') === id)
    }

    return undefined
  }

  clearLayers(group) {
    if (group in this._layers) {
      const layers = this.getLayersArray(group)
      this.getLayers(group).clear()
      this.fire('layerremoved', {
        type: group,
        layers: layers,
      })
    }

    return this
  }

  toggleLayers(group, ids = []) {
    if (group in this._layers) {
      this.getLayersArray(group).forEach((layer) => {
        layer.setVisible(ids.includes(layer.get('id')))
      })
    }

    return this
  }

  popup(el, opts = {}) {
    if (el) {
      const defaults = {
        positioning: 'bottom-center',
        offset: [0, -5],
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      }
      this.pop = new Overlay({
        ...defaults,
        ...opts,
        element: el,
      })
      this._map.addOverlay(this.pop)
    } else {
      this._map.removeOverlay(this.pop)
      this.pop = null
    }

    return this
  }

  start() {
    this._map.on('pointermove', (evt) => {
      this.fire('pointermove', evt)
    })
    this._map.on('singleclick', (evt) => {
      this.fire('singleclick', evt)
    })
  }

  on(type, cb) {
    if (type in this._listeners) {
      this._listeners[type].push({
        enabled: true,
        callback: cb,
      })
    }
  }

  off(type, cb) {
    if (type in this._listeners) {
      this._listeners[type] = this._listeners[type].filter(
        (listener) => listener.callback !== cb,
      )
    }
  }

  fire(type, evt) {
    this._listeners[type].forEach((listener) => {
      if (listener.enabled && typeof listener.callback === 'function') {
        listener.callback(evt)
      }
    })
  }

  enableListeners(type) {
    if (type in this._listeners) {
      this._listeners[type].forEach((listener) => {
        listener.enabled = true
      })
    }
  }

  disableListeners(type) {
    if (type in this._listeners) {
      this._listeners[type].forEach((listener) => {
        listener.enabled = false
      })
    }
  }

  hover(cb = null) {
    if (this._map) {
      this.on('pointermove', (evt) => this.mouseMove(evt, cb))
    }

    return this
  }

  removeHover(cb = null) {
    this.off('pointermove', (evt) => this.mouseMove(evt, cb))
  }

  mouseMove(evt, cb = null) {
    if (evt.dragging) {
      return
    }
    try {
      const pixel = evt.map.getEventPixel(evt.originalEvent)
      let hit = evt.map.hasFeatureAtPixel(pixel)
      if (!hit) {
        const hitData = this.getLayersArray('info').map((layer) => {
          const data = layer.getData(evt.pixel)
          // transparent pixels have zero for data[3]
          if (data && data.length) {
            return data[3]
          }
          return 0
        })
        hit = hitData.reduce((partialSum, a) => partialSum + a, 0)
      }
      const target = evt.map.getTargetElement()
      if (target) {
        target.style.cursor = hit ? 'pointer' : ''
      }
      if (typeof cb === 'function') {
        cb(evt)
      }
    } catch (err) {
      /* empty */
    }
  }

  click(cb, hover = true) {
    if (hover) {
      this.hover()
    }
    if (this._map) {
      this.on('singleclick', (evt) => {
        const result = []
        evt.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          result.push({ layer, feature })
        })
        if (typeof cb === 'function') {
          cb(evt, result)
        }
      })
    }

    return this
  }

  export() {
    return new Promise((resolve, reject) => {
      if (!this._map) {
        return reject()
      }
      this._map.once('rendercomplete', () => {
        const canvas = exportMapCanvas(this._map)
        resolve(canvas.toDataURL())
      })
      this._map.renderSync()
    })
  }

  scalebar(target = null, bar = false, steps = 4, scale = true) {
    const control = new ScaleLine({
      target,
      bar,
      steps,
      text: scale,
      minWidth: 150,
      maxWidth: 300,
    })

    this._map.addControl(control)
  }

  measure(opts) {
    if (this._measure) {
      this.stopMeasure()
    }
    this._measure = new Measure(this, opts)
    this._measure.start()
  }

  stopMeasure() {
    if (this._measure) {
      this._measure.stop()
    }
    this._measure = null
  }

  getAllFeatures() {
    let fset = []
    this.getLayersArray('info').forEach((layer) => {
      if (typeof layer.getSource()?.getFeatures === 'function') {
        fset = fset.concat(layer.getSource().getFeatures())
      }
    })
    this.getLayersArray('over').forEach((layer) => {
      if (typeof layer.getSource()?.getFeatures === 'function') {
        fset = fset.concat(layer.getSource().getFeatures())
      }
    })
    return fset
  }
}
