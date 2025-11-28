import Vector from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

import { DEFAULT_STYLE } from '../defaults.mjs'
import { createFeatures, formats } from '../feature.mjs'

export class FeatureLayer extends Vector {
  constructor(opts) {
    const sourceOpts = { ...opts }
    if (opts.features?.length) {
      sourceOpts.features = createFeatures(opts.features)
    }
    if (opts.url) {
      sourceOpts.format =
        opts.format && opts.format in formats
          ? formats[opts.format]
          : formats.geojson
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
