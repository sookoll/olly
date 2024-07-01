import Vector from 'ol/layer/Vector'
import ClusterSource from 'ol/source/Cluster'
import VectorSource from 'ol/source/Vector'

import { CLUSTER_DISTANCE, DEFAULT_STYLE } from '../defaults'
import { createFeatures } from '../feature'

export class ClusterFeatureLayer extends Vector {
  constructor(opts) {
    const features =
      opts.features && opts.features.length ? createFeatures(opts.features) : []
    const source = new VectorSource({
      features,
    })
    const clusterSource = new ClusterSource({
      distance: opts.distance || CLUSTER_DISTANCE,
      source,
    })
    super({
      source: clusterSource,
      style: opts.style || DEFAULT_STYLE,
    })
  }
}
