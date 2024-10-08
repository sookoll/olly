import Vector from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

import { DEFAULT_STYLE } from '../defaults'
import { createFeatures, formats } from '../feature'

export class FeatureLayer extends Vector {
  constructor(opts) {
    const sourceOpts = { ...opts }
    if (opts.url) {
      sourceOpts.format =
        opts.format && opts.format in formats
          ? formats[opts.format]
          : formats.geojson
    }

    const source = new VectorSource(sourceOpts)
    if (opts?.features?.length) {
      const features = createFeatures(opts.features)
      source.addFeatures(features)
    }
    super({
      source,
      style: opts.style || DEFAULT_STYLE,
      updateWhileAnimating: opts.updateWhileAnimating,
      updateWhileInteracting: opts.updateWhileInteracting,
    })
  }
}
