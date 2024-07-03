import Vector from 'ol/layer/Vector'
import WebGLVectorLayerRenderer from 'ol/renderer/webgl/VectorLayer'
import VectorSource from 'ol/source/Vector'

import { DEFAULT_STYLE } from '../defaults'
import { createFeatures } from '../feature'

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
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      style: this.getStyle(),
    })
  }
}
