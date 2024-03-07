import LayerTile from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { LayerDef, LayerType } from '../layer'
import TileSource from 'ol/source/Tile'
import OSM from 'ol/source/OSM'

export class TileLayer extends LayerTile<TileSource> {
  constructor(opts: LayerDef) {
    // delete opts.maxResolution
    // delete opts.minResolution
    let source
    switch (opts.type) {
      case LayerType.XYZ:
        source = new XYZ(opts)
        break
      case LayerType.OSM:
        source = new OSM(opts)
        break
    }
    super({ source })
  }
}
