import LayerTile from 'ol/layer/Tile'
import { LayerDef } from '../layer'
import BingMaps from 'ol/source/BingMaps'

export enum BingSet {
  RoadOnDemand = 'RoadOnDemand',
  Aerial = 'Aerial',
  AerialWithLabelsOnDemand = 'AerialWithLabelsOnDemand',
  CanvasDark = 'CanvasDark',
  OrdnanceSurvey = 'OrdnanceSurvey',
}

export interface BingLayerDef extends LayerDef {
  layer: string
  key: string
}

export class BingLayer extends LayerTile<BingMaps> {
  constructor(opts: BingLayerDef) {
    // delete opts.maxResolution
    // delete opts.minResolution

    const source = new BingMaps({
      ...opts,
      key: opts.key,
      imagerySet: opts.layer || BingSet.RoadOnDemand,
    })

    super({ source })
  }
}
