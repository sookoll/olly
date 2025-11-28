import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'

export class OsmLayer extends TileLayer {
  constructor() {
    super({
      preload: Infinity,
      source: new OSM(),
      visible: true,
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
