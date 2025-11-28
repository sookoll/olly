import Vector from 'ol/layer/Vector'
import WebGLVectorLayerRenderer from 'ol/renderer/webgl/VectorLayer'
import VectorSource from 'ol/source/Vector'

import { DEFAULT_STYLE } from '../defaults.mjs'
import { createFeatures } from '../feature.mjs'

export class WGLFeatureLayer extends Vector {
  constructor(opts) {
    const features =
      opts.features && opts.features.length ? createFeatures(opts.features) : []
    const source = new VectorSource({
      features,
    })
    super({
      source,
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

  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      style: this.getStyle(),
    })
  }
}
