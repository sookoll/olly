import Vector from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

import { DEFAULT_STYLE } from '../defaults'
import { createFeatures } from '../feature'

export class FeatureLayer extends Vector {
  constructor(opts) {
    const features =
      opts.features && opts.features.length ? createFeatures(opts.features) : []
    const source = new VectorSource({
      features,
    })
    super({
      source,
      style: opts.style || DEFAULT_STYLE,
      updateWhileAnimating: opts.updateWhileAnimating,
      updateWhileInteracting: opts.updateWhileInteracting,
    })
  }
}
