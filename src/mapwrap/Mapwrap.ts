import Map from 'ol/Map'
import View from 'ol/View'
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
import BaseLayer from 'ol/layer/Base'
import { DEFAULT_PROJECTION, MAX_ZOOM, MIN_ZOOM } from './constants'
import Layer from 'ol/layer/Layer'
import { GroupLayer } from './components/layer/GroupLayer'

enum GroupType {
  base = 'base',
  info = 'info',
  overlays = 'overlays',
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

export class Mapwrap {
  private conf: MapConf
  private map: Map
  private _projection: Projection | null = null
  private layers: Layers
  private activeBaseLayer: string | null = null

  constructor(conf: MapConf) {
    this.conf = conf
    this._projection = setProjection(conf.projection || DEFAULT_PROJECTION)

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
      this.createBaseLayers(conf.baseLayers)
    }
    if (conf.infoLayers?.length) {
      conf.infoLayers.forEach(this.infoLayer)
    }
    if (conf.overlays?.length) {
      conf.overlays.forEach(this.overlay)
    }
  }

  public projection(projection: string): this {
    this._projection = setProjection(projection)

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
    return this
  }

  public center(coordinates: Coordinate): this {
    this.map.getView().setCenter(coordinates)
    return this
  }

  public zoom(zoom: number): this {
    this.map.getView().setZoom(zoom)
    return this
  }

  public render(target: string | HTMLElement): this {
    this.map.setTarget(target)
    return this
  }

  public baseLayer(definition: LayerDef): this {
    const def = {
      ...definition,
      visible: false,
      zIndex: 0,
    }
    const layer = this.createLayer(def)
    if (layer) {
      this.addLayerTo(GroupType.base, layer)
    }
    return this
  }

  public infoLayer(definition: LayerDef): this {
    const layer = this.createLayer({ ...definition })
    if (layer) {
      this.addLayerTo(GroupType.info, layer)
    }
    return this
  }

  public overlay(definition: LayerDef): this {
    const layer = this.createLayer({ ...definition })
    if (layer) {
      this.addLayerTo(GroupType.overlays, layer)
    }
    return this
  }

  public changeBaseLayer(id: string) {
    const layers = this.layers.base.getLayers().getArray().filter(layer => layer.get('id') === id)
    if (layers.length === 1) {
      this.layers.base.getLayers().forEach(layer => {
        layer.setVisible(false)
      })
      layers[0].setVisible(true)
    }
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
      //pixelRatio: 2,
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

  private addLayerTo(group: GroupType, layer: BaseLayer) {
    this.layers[group].getLayers().push(layer)
  }

  private createBaseLayers(definitions: LayerDef[]): void {
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

    definitions.forEach(this.baseLayer)
  }
}
