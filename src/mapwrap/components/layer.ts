import { GroupLayer, GroupLayerDef } from './layer/GroupLayer'
import { ImageLayer } from './layer/ImageLayer'
import { TileLayer } from './layer/TileLayer'
import Layer from 'ol/layer/Layer'
import { WMTSLayer, WMTSLayerDef } from './layer/WMTSLayer'
import { BingLayer, BingLayerDef } from './layer/BingLayer'
import { FeatureLayer, FeatureLayerDef } from './layer/FeatureLayer'
import { DEFAULT_STYLE } from '../constants'
import { ClusterLayer } from './layer/ClusterLayer'
import KmlGroundOverlayLayer, {
  KMLGroundOverlayDef,
} from './layer/KmlGroundOverlayLayer'
import { uid } from '../utils'
import { TileWMSLayerDef, TileWmsLayer } from './layer/TileWmsLayer'
import { MvtLayerDef } from './layer/MvtLayer'

export interface Layers {
  base: GroupLayer
  info: GroupLayer
  overlays: GroupLayer
}

export interface LayerDef {
  type: LayerType // LayerType
  id?: string
  label?: string
  url?: string
  icon?: string
  projection?: string
  visible?: boolean
  minResolution?: number
  maxResolution?: number
  minZoom?: number
  maxZoom?: number
  extent?: number[]
  opacity?: number
  zIndex?: number
  crossOrigin?: string
  attributions?: string
}

export interface WMSLayerDef extends LayerDef {
  params: {
    [x: string]: any
  }
}

export interface TileLayerDef extends LayerDef {
  tileGrid?: {
    minZoom: number
    maxZoom: number
  }
}

export enum LayerType {
  Group = 'Group',
  OSM = 'OSM',
  Bing = 'Bing',
  XYZ = 'XYZ',
  TileWMS = 'TileWMS',
  WMTS = 'WMTS',
  ImageWMS = 'ImageWMS',
  FeatureCollection = 'FeatureCollection',
  KMLGroundOverlay = 'KMLGroundOverlay',
}

type LayerDefinitions =
  | LayerDef
  | WMSLayerDef
  | GroupLayerDef
  | BingLayerDef
  | WMTSLayerDef
  | TileWMSLayerDef
  | FeatureLayerDef
  | KMLGroundOverlayDef
  | MvtLayerDef

export const createLayerGroup = (definition: GroupLayerDef): GroupLayer => {
  const layers: (Layer | GroupLayer)[] = []
  const def: GroupLayerDef = { ...definition }
  if (def.layers?.length) {
    for (let i = 0; i < def.layers.length; i++) {
      const inputConf: LayerDefinitions = { ...def.layers[i] }
      // add projection to sublayer
      if (!inputConf.projection) {
        inputConf.projection = definition.projection
      }
      if (!inputConf.zIndex) {
        inputConf.zIndex = definition.zIndex
      }
      const layer: Layer | GroupLayer | undefined = createLayer(inputConf)
      if (layer) {
        layers.push(layer)
      }
    }
  }
  // group should be visible, if not specified
  if (typeof def.visible === 'undefined') {
    def.visible = true
  }
  const layer = new GroupLayer({ layers })
  set(layer, def)
  return layer
}

export const createLayer = (
  definition: LayerDefinitions,
): Layer | GroupLayer | undefined => {
  let layer
  const def: LayerDefinitions = { ...definition }
  def.crossOrigin = 'Anonymous'

  switch (def.type) {
    case LayerType.Group:
      return createLayerGroup({
        ...def,
        layers: 'layers' in def ? def.layers : [],
      })
    case LayerType.ImageWMS:
      layer = new ImageLayer(def)
      break
    case LayerType.OSM:
    case LayerType.XYZ:
      layer = new TileLayer(def)
      break
    case LayerType.TileWMS:
      if ('params' in def) {
        layer = new TileWmsLayer(def)
      }
      break
    case LayerType.Bing:
      if ('layer' in def && 'key' in def) {
        layer = new BingLayer(def)
      }
      break
    case LayerType.WMTS:
      if ('layer' in def && 'matrixSet' in def) {
        layer = new WMTSLayer(def)
      }
      break
    case LayerType.FeatureCollection:
      if ('features' in def) {
        if (!def.style) {
          def.style = DEFAULT_STYLE
        }
        layer = def.clusters ? new ClusterLayer(def) : new FeatureLayer(def)
      }
      break
    case 'KMLGroundOverlay':
      layer = new KmlGroundOverlayLayer(def)
      if (layer.get('screenOverlays') && 'info' in def) {
        if (def.info) {
          def.info.legend = layer.get('screenOverlays')
        }
      }
      break
  }
  set(layer, def)

  return layer
}

const set = (
  layer: Layer | GroupLayer | undefined,
  definition: LayerDefinitions,
): void => {
  if (!layer) {
    return
  }
  if (typeof definition.visible === 'boolean') {
    layer.setVisible(definition.visible)
  }
  if (typeof definition.id === 'undefined') {
    definition.id = uid()
  }
  layer.set('id', definition.id)
  if (definition.label) {
    layer.set('title', definition.label)
  }
  if (definition.type) {
    layer.set('type', definition.type)
  }
  if (definition.icon) {
    layer.set('icon', definition.icon)
  }
  if (definition.minResolution) {
    layer.setMinResolution(definition.minResolution)
  }
  if (definition.maxResolution) {
    layer.setMaxResolution(definition.maxResolution)
  }
  if (typeof definition.opacity !== 'undefined') {
    layer.setOpacity(definition.opacity)
  }
  if (typeof definition.zIndex !== 'undefined') {
    layer.setZIndex(definition.zIndex)
  } else {
    layer.setZIndex(100)
  }
  if ('clusters' in definition) {
    layer.set('clusters', definition.clusters)
  }
  layer.set('conf', definition)
}
