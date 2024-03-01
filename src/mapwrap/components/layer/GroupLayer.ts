import LayerGroup from 'ol/layer/Group'
import { LayerDef } from '../layer'

export interface GroupLayerDef extends LayerDef {
  layers: LayerDef[]
}

export class GroupLayer extends LayerGroup {}
