import LayerTile from 'ol/layer/Tile'
import { TileLayerDef, WMSLayerDef } from '../layer'
import TileWMS from 'ol/source/TileWMS'
import TileGrid from 'ol/tilegrid/TileGrid'
import { getProjection } from '../projection'
import { getWidth } from 'ol/extent'
import { range } from '../../utils'
import { DEFAULT_TILE, MAX_ZOOM, MIN_ZOOM } from '../../constants'

export interface TileWMSLayerDef extends WMSLayerDef, TileLayerDef {
  tileSize?: number
}

export class TileWmsLayer extends LayerTile<TileWMS> {
  constructor(opts: TileWMSLayerDef) {
    delete opts.maxResolution
    delete opts.minResolution
    const source = new TileWMS({
      ...opts,
      tileGrid:
        opts.tileSize && opts.tileSize !== DEFAULT_TILE
          ? tileGridWMS(opts)
          : undefined,
    })
    super({ source })
  }
}

const tileGridWMS = (opts: TileWMSLayerDef): TileGrid => {
  const tile = opts.tileSize || DEFAULT_TILE
  const projExtent = getProjection(opts.projection)?.getExtent()
  const startResolution = getWidth(projExtent || []) / tile
  const resolutions = range(
    opts.tileGrid?.minZoom || opts.minZoom || MIN_ZOOM,
    (opts.tileGrid?.maxZoom || opts.maxZoom || MAX_ZOOM) + 1,
  )
  for (let i = 0, ii = resolutions.length; i < ii; ++i) {
    resolutions[i] = startResolution / Math.pow(2, i)
  }
  return new TileGrid({
    extent: projExtent,
    resolutions: resolutions,
    tileSize: [tile, tile],
  })
}
