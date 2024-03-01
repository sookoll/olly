import LayerTile from 'ol/layer/Tile'
import { LayerDef } from '../layer'
import WMTS from 'ol/source/WMTS'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { getTopLeft } from 'ol/extent'
import { range } from '../../utils'
import { MAX_ZOOM } from '../../constants'

export interface WMTSLayerDef extends LayerDef {
  layer: string
  style: string
  matrixSet: string
  matrixSetCount: number
  matrixSetPrepend: string
}

export class WMTSLayer extends LayerTile<WMTS> {
  constructor(opts: WMTSLayerDef) {
    const source = new WMTS({
      ...opts,
      layer: opts.layer,
      style: opts.style,
      matrixSet: opts.matrixSet,
      tileGrid: tileGridWMTS(opts),
    })
    super({ source })
  }
}

const tileGridWMTS = (opts: WMTSLayerDef): WMTSTileGrid => {
  const resolutions = range(0, opts.matrixSetCount || MAX_ZOOM)
  const matrixIds: string[] = []
  for (let i = 0, ii = resolutions.length; i < ii; ++i) {
    resolutions[i] = (opts.maxResolution || 1) / Math.pow(2, i)
    matrixIds[i] = (
      opts.matrixSetPrepend ? opts.matrixSetPrepend + i : i
    ).toString()
  }
  return new WMTSTileGrid({
    extent: opts.extent || [],
    origin: getTopLeft(opts.extent || []),
    resolutions: resolutions,
    matrixIds: matrixIds,
  })
}
