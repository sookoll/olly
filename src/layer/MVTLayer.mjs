import { applyBackground, applyStyle } from 'ol-mapbox-style'
import VectorTileLayer from 'ol/layer/VectorTile'

export class MVTLayer extends VectorTileLayer {
  constructor(opts) {
    super(opts)
    Promise.all([
      applyStyle(this, opts.url),
      applyBackground(this, opts.url)
    ]).then(() => {})
  }
}
