import LayerGroup from 'ol/layer/Group'

export class GroupLayer extends LayerGroup {
  constructor(opts = {}) {
    super(opts)
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
