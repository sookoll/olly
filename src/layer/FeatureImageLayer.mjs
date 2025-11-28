import { VectorImage } from 'ol/layer'
import VectorSource from 'ol/source/Vector'

import { DEFAULT_STYLE } from '../defaults.mjs'
import { createFeatures } from '../feature.mjs'

export class FeatureImageLayer extends VectorImage {
  constructor(opts) {
    const features =
      opts.features && opts.features.length ? createFeatures(opts.features) : []
    const source = new VectorSource({
      features,
    })
    super({
      source,
      imageRatio: 2,
      style: opts.style || DEFAULT_STYLE,
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
