import Map from 'ol/Map'
import View, { AnimationOptions } from 'ol/View'
import { Coordinate } from 'ol/coordinate'
import {
  DragPan,
  MouseWheelZoom,
  defaults as defaultInteractions,
} from 'ol/interaction'
import { platformModifierKeyOnly } from 'ol/events/condition'
import {
  TransformationType,
  setProjection,
  transform,
} from './components/projection'
import { Projection } from 'ol/proj'
import {
  LayerDef,
  LayerType,
  Layers,
  createLayer,
  createLayerGroup,
} from './components/layer'
import { Extent } from 'ol/extent'
import {
  DEFAULT_PROJECTION,
  MAP_ANIMATION,
  MAX_ZOOM,
  MIN_ZOOM,
} from './constants'
import Layer from 'ol/layer/Layer'
import { GroupLayer } from './components/layer/GroupLayer'
import BaseLayer from 'ol/layer/Base'
import { MapBrowserEvent } from 'ol'
import { Pixel } from 'ol/pixel'
import { FeatureLike } from 'ol/Feature'
import { drawMap } from './components/export.ts'

enum GroupType {
  base = 'base',
  info = 'info',
  overlays = 'overlays',
}

enum UpdateType {
  pan = 'pan',
  zoom = 'zoom',
  fit = 'fit',
}

interface MapConf {
  target?: string
  projection?: string
  bbox?: Extent
  padding?: number[]
  center?: Coordinate
  zoom?: number
  minZoom?: number
  maxZoom?: number
  baseLayers?: LayerDef[]
  infoLayers?: LayerDef[]
  overlays?: LayerDef[]
  baseLayer?: string
  zoomControl?: boolean
  twoFingerPanZoom?: boolean
  enableRotation?: boolean
}

interface ClickResult {
  feature: FeatureLike
  layer: Layer
}

export class Mapwrap {
  private conf: MapConf
  private map: Map
  private _projection: Projection | null = null
  private layers: Layers
  private activeBaseLayer: string | null = null

  constructor(conf: MapConf) {
    this.conf = conf
    this.projection(conf.projection || DEFAULT_PROJECTION)

    this.layers = {
      [GroupType.base]: createLayerGroup({
        type: LayerType.Group,
        layers: [],
      }),
      [GroupType.info]: createLayerGroup({
        type: LayerType.Group,
        layers: [],
      }),
      [GroupType.overlays]: createLayerGroup({
        type: LayerType.Group,
        layers: [],
      }),
    }

    this.map = this.createMap(conf)
    this.map.setView(this.createView(conf))

    this.activeBaseLayer = this.conf.baseLayer || null

    if (conf.baseLayers?.length) {
      this.baseLayers(conf.baseLayers)
    }
    if (conf.infoLayers?.length) {
      this.infoLayers(conf.infoLayers)
    }
    if (conf.overlays?.length) {
      this.overlays(conf.overlays)
    }
    if (this.activeBaseLayer) {
      this.changeBaseLayer(this.activeBaseLayer)
    }
  }

  /**
   * Get map object
   * return Map
   */
  public getMap(): Map {
    return this.map
  }

  /**
   * Find Layer by group and layer id
   * @param group
   * @param id
   * return BaseLayer | undefined
   */
  public findLayer(group: GroupType, id: string): BaseLayer | undefined {
    if (group in this.layers && id) {
      return this.layers[group]
        .getLayers()
        .getArray()
        .find((layer: BaseLayer): boolean => layer.get('id') === id)
    }
    return undefined
  }

  /**
   * Change projection
   * @param projection string epsg code
   * return this
   */
  public projection(projection: string): this {
    this._projection = setProjection(projection || DEFAULT_PROJECTION)
    if (this.map) {
      const view: View = this.map.getView()
      const viewProps = view.getProperties()
      const currentProj = view.getProjection()
      if (viewProps.center) {
        viewProps.center = transform(
          TransformationType.coordinate,
          viewProps.center,
          currentProj.getCode(),
          this._projection?.getCode(),
        )
      }
      this.map.setView(this.createView(viewProps))
    }
    return this
  }

  /**
   * Set map center or pan to center with animation
   * @param center
   * @param animate
   * return this
   */
  public center(center: Coordinate, animate: boolean = false): this {
    if (animate) {
      this.animate({ center })
    } else {
      this.map.getView().setCenter(center)
    }
    this.hasUpdated(UpdateType.pan)
    return this
  }

  /**
   * Fit map into Extent
   * @param bbox Extent
   * return this
   */
  public fitTo(bbox: Extent): this {
    if (bbox.length && bbox.length === 4) {
      this.map.getView().fit(bbox, {
        maxZoom: this.map.getView().getMaxZoom(),
        duration: MAP_ANIMATION,
      })
      this.hasUpdated(UpdateType.fit)
    }
    return this
  }

  /**
   * Fit map to layer bbox
   */
  public fitToLayer() {
    // TODO
  }

  /**
   * Zoom map to given level
   * @param zoom
   * @param animate
   * return this
   */
  public zoom(zoom: number, animate: boolean = false): this {
    if (animate) {
      this.animate({ zoom })
    } else {
      this.map.getView().setZoom(zoom)
    }
    this.hasUpdated(UpdateType.zoom)
    return this
  }

  public zoomIn(): this {
    const zoom: number | undefined = this.map.getView().getZoom()
    if (zoom !== undefined) {
      this.zoom(zoom + 1, true)
    }
    return this
  }

  public zoomOut(): this {
    const view = this.map.getView()
    const zoom: number | undefined = view.getZoom()
    if (zoom !== undefined) {
      this.zoom(zoom - 1, true)
    }
    return this
  }

  public render(target: string | HTMLElement): this {
    this.map.setTarget(target)
    return this
  }

  public padding(pads: number[]): this {
    const center: Coordinate | undefined = this.map.getView().getCenter()
    this.map.getView().padding = pads
    center && this.center(center, true)
    return this
  }

  public baseLayer(
    definition: LayerDef,
    cb: ((id: string) => void) | null = null,
  ): this {
    const def = {
      ...definition,
      visible: false,
      zIndex: 0,
    }
    const layer = this.createLayer(def)

    if (layer) {
      this.addLayerTo(GroupType.base, layer)
    }
    if (layer && typeof cb === 'function') {
      cb(layer.get('id'))
    }
    return this
  }

  public infoLayer(
    definition: LayerDef,
    cb: ((id: string) => void) | null = null,
  ): this {
    const layer = this.createLayer({ ...definition })
    if (layer) {
      this.addLayerTo(GroupType.info, layer)
    }
    if (layer && typeof cb === 'function') {
      cb(layer.get('id'))
    }
    return this
  }

  public overlay(
    definition: LayerDef,
    cb: ((id: string) => void) | null = null,
  ): this {
    const layer = this.createLayer({ ...definition })
    if (layer) {
      this.addLayerTo(GroupType.overlays, layer)
    }
    if (layer && typeof cb === 'function') {
      cb(layer.get('id'))
    }
    return this
  }

  public baseLayers(definitions: LayerDef[]): void {
    this.clearLayers(GroupType.base)
    if (!definitions.length) {
      return
    }
    if (!this.activeBaseLayer) {
      const activeLayerDef = definitions.find(
        (definition) => definition.visible,
      )
      if (activeLayerDef?.id) {
        this.activeBaseLayer = activeLayerDef.id
      }
    }
    definitions.forEach((layerDef: LayerDef) => this.baseLayer(layerDef))
  }

  public infoLayers(definitions: LayerDef[]): void {
    this.clearLayers(GroupType.info)
    if (!definitions.length) {
      return
    }
    definitions.forEach((layerDef: LayerDef) => this.infoLayer(layerDef))
  }

  public overlays(definitions: LayerDef[]): void {
    this.clearLayers(GroupType.overlays)
    if (!definitions.length) {
      return
    }
    definitions.forEach((layerDef: LayerDef) => this.overlay(layerDef))
  }

  public clearLayers(group: GroupType): void {
    this.layers[group].getLayers().clear()
  }

  public changeBaseLayer(id: string): this {
    this.layers[GroupType.base].getLayers().forEach((layer: BaseLayer) => {
      layer.setVisible(false)
    })
    const layer = this.layers[GroupType.base]
      .getLayers()
      .getArray()
      .find((layer) => layer.get('id') === id)
    if (layer) {
      layer.setVisible(true)
    }
    return this
  }

  public toggleLayers(group: GroupType, ids: string[]): this {
    this.layers[group]
      .getLayers()
      .getArray()
      .forEach((layer: BaseLayer) => {
        layer.setVisible(ids.includes(layer.get('id')))
      })
    return this
  }

  public hover(cb: ((evt: MapBrowserEvent<any>) => void) | null = null): this {
    this.map.on('pointermove', (evt: MapBrowserEvent<any>): void => {
      const pixel: Pixel = this.map.getEventPixel(evt.originalEvent)
      const hit = this.map.hasFeatureAtPixel(pixel)
      const target: HTMLElement = this.map.getTargetElement()
      if (target) {
        target.style.cursor = hit ? 'pointer' : ''
      }
      if (typeof cb === 'function') {
        cb(evt)
      }
    })
    return this
  }

  public click(
    cb:
      | ((evt: MapBrowserEvent<any>, result: ClickResult[]) => void)
      | null = null,
  ): this {
    this.map.on('click', (evt: MapBrowserEvent<any>): void => {
      const result: ClickResult[] = []
      this.map.forEachFeatureAtPixel(
        evt.pixel,
        (feature: FeatureLike, layer: Layer): void => {
          result.push({ layer, feature })
        },
      )
      if (typeof cb === 'function') {
        cb(evt, result)
      }
    })
    return this
  }

  public export(): Promise<string> {
    return new Promise((resolve): void => {
      this.map.once('rendercomplete', (): void => {
        const canvas = drawMap(this.map)
        resolve(canvas.toDataURL())
      })
      this.map.renderSync()
    })
  }

  private animate(opts: AnimationOptions): void {
    this.map.getView().animate({ ...opts, duration: MAP_ANIMATION })
  }

  private createMap(conf: MapConf): Map {
    const interactions = conf.twoFingerPanZoom
      ? defaultInteractions({ dragPan: false, mouseWheelZoom: false }).extend([
          new DragPan({
            condition: platformModifierKeyOnly,
          }),
          new MouseWheelZoom({
            condition: platformModifierKeyOnly,
          }),
        ])
      : defaultInteractions()

    return new Map({
      layers: Object.values(this.layers),
      controls: [],
      interactions,
      target: conf.target,
      moveTolerance: 2,
    })
  }

  private createView(conf: MapConf): View {
    return new View({
      projection: this._projection || DEFAULT_PROJECTION,
      center: conf.center || [0, 0],
      zoom: conf.zoom || MIN_ZOOM,
      minZoom: conf.minZoom || MIN_ZOOM,
      maxZoom: conf.maxZoom || MAX_ZOOM,
      enableRotation: !!conf.enableRotation,
      padding: conf.padding,
    })
  }

  private createLayer(definition: LayerDef): Layer | GroupLayer | undefined {
    if (!('minZoom' in definition)) {
      definition.minZoom = this.map.getView().getMinZoom()
    }
    if (!('maxZoom' in definition)) {
      definition.maxZoom = this.map.getView().getMaxZoom()
    }
    return createLayer(definition)
  }

  private addLayerTo(group: GroupType, layer: Layer | GroupLayer) {
    this.layers[group].getLayers().push(layer)
  }

  private hasUpdated(type: UpdateType) {
    setTimeout(() => {
      // TODO
      console.log(type)
    }, MAP_ANIMATION)
  }
}
