import LayerTile from 'ol/layer/Tile'
import { XYZ } from 'ol/source'

export class TileLayer extends LayerTile {
  constructor(opts) {
    const source = new XYZ(opts)
    super({ source })
  }
}
