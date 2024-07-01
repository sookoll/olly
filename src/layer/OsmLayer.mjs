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
}
