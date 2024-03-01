import Vector from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { LayerDef } from '../layer'
import { StyleLike } from 'ol/style/Style'
import { FlatStyleLike } from 'ol/style/flat'
import { createFeatures } from '../feature'
import Feature from 'ol/Feature'
import { GeoJSONFeature } from 'ol/format/GeoJSON'

export interface FeatureLayerDef extends LayerDef {
  features: GeoJSONFeature[]
  style: StyleLike | FlatStyleLike | null
  clusters?: boolean
  updateWhileAnimating: boolean
  updateWhileInteracting: boolean
}

export class FeatureLayer extends Vector<VectorSource> {
  constructor(opts: FeatureLayerDef) {
    const features: Feature[] = opts.features ? createFeatures(opts) : []
    const source = new VectorSource({
      features,
    })
    super({
      source,
      style: opts.style,
      updateWhileAnimating: opts.updateWhileAnimating,
      updateWhileInteracting: opts.updateWhileInteracting,
    })
  }
}
