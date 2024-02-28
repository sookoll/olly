import Map from 'ol/Map';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import { Coordinate } from 'ol/coordinate';
import TileLayer from 'ol/layer/Tile';

export class Mapwrap {
  private map: Map;
  private projection: string;

  constructor() {
    this.projection = 'EPSG:3857';
    this.map = this.createMap();
  }

  public center(coordinates: Coordinate): this {
    this.map.getView().setCenter(coordinates);
    return this;
  }

  public zoom(zoom: number): this {
    this.map.getView().setZoom(zoom);
    return this;
  }

  public render(target: string | HTMLElement): this {
    this.map.setTarget(target);
    return this;
  }

  private createMap(): Map {
    const osmSource = new OSM();
    return new Map({
      layers: [
        new TileLayer({
          source: osmSource,
        }),
      ],
      controls: [],
      moveTolerance: 2,
      pixelRatio: 2,
      view: new View({
        projection: this.projection
      }),
    });
  }
}
