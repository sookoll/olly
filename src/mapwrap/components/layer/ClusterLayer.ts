import Vector from 'ol/layer/Vector'
import Cluster from 'ol/source/Cluster'
import VectorSource from 'ol/source/Vector'
import { FeatureLayerDef } from './FeatureLayer'
import { CLUSTER_DISTANCE } from '../../constants'
import { Geometry, Point } from 'ol/geom'
import Feature from 'ol/Feature'
import { Extent, getCenter } from 'ol/extent'
import { createFeatures } from '../feature'

export interface ClusterLayerDef extends FeatureLayerDef {
  clusterDistance?: number
}

export class ClusterLayer extends Vector<Cluster> {
  constructor(opts: ClusterLayerDef) {
    const features = opts.features ? createFeatures(opts) : []
    const source = new Cluster({
      distance: opts.clusterDistance || CLUSTER_DISTANCE,
      source: new VectorSource({
        features,
      }),
      geometryFunction: (feature: Feature<Geometry>) => {
        const extent: Extent | undefined = feature.getGeometry()?.getExtent()
        if (extent) {
          return new Point(getCenter(extent))
        }
        return new Point([0, 0])
      },
      createCluster: (point, features) => {
        return new Feature({
          geometry: features.length > 1 ? point : features[0].getGeometry(),
          features: features,
        })
      },
    })
    super({
      source,
      style: opts.style,
      updateWhileAnimating: opts.updateWhileAnimating,
      updateWhileInteracting: opts.updateWhileInteracting,
    })
  }
}
