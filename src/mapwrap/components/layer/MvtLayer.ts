import LayerVectorTile from 'ol/layer/VectorTile'
import VectorTile from 'ol/source/VectorTile'
import { createXYZ } from 'ol/tilegrid'
import MVT from 'ol/format/MVT'
import { TileLayerDef } from '../layer'
import { StyleLike } from 'ol/style/Style'

export interface MvtLayerDef extends TileLayerDef {
  style: StyleLike | undefined | null
}

export class MvtLayer extends LayerVectorTile {
  constructor(opts: MvtLayerDef) {
    const options = {
      source: new VectorTile({
        tileGrid: createXYZ(opts.tileGrid),
        format: new MVT(),
        url: opts.url,
        transition: 0,
        cacheSize: 0,
      }),
      preload: 0,
      style: opts.style,
      projection: opts.projection,
      declutter: true,
    }
    super(options)
  }
}
