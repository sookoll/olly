import Vector from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

import { DEFAULT_STYLE } from '../defaults.mjs'
import FlatJSON from '../format/FlatJSON.mjs'

export class DirectusLayer extends Vector {
  constructor(opts) {
    const sourceOpts = { ...opts }
    if (opts.url) {
      sourceOpts.format = new FlatJSON({
        dataPrefix: 'data',
        dataGeometryName: opts.geometryName,
      })
    }

    const source = new VectorSource(sourceOpts)
    super({
      source,
      style: opts.style || DEFAULT_STYLE,
      updateWhileAnimating: opts.updateWhileAnimating,
      updateWhileInteracting: opts.updateWhileInteracting,
    })
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
