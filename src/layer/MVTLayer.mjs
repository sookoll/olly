import VectorTileLayer from 'ol/layer/VectorTile'
import { applyBackground, applyStyle } from 'ol-mapbox-style'

export class MVTLayer extends VectorTileLayer {
  constructor(opts) {
    super(opts)
    Promise.all([
      applyStyle(this, opts.url),
      applyBackground(this, opts.url),
    ]).then(() => {})
  }

  getLayerStatesArray(dest) {
    return super.getLayerStatesArray(dest)
  }

  getLayersArray(array) {
    return super.getLayersArray(array)
  }

  getSourceState() {
    return super.getSourceState()
  }
}
