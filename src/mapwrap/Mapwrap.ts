import Map from 'ol/Map'
import View from 'ol/View'
import OSM from 'ol/source/OSM'
import { Coordinate } from 'ol/coordinate'
import TileLayer from 'ol/layer/Tile'
import { DEFAULT_PROJECTION, TransformationType, setProjection, transform } from './components/projection'
import { Projection } from 'ol/proj'

export class Mapwrap {
  private map: Map
  private _projection: string

  constructor() {
    this._projection = DEFAULT_PROJECTION
    this.map = this.createMap()
  }

  public projection(projection: string): this {
    setProjection(projection)
    this._projection = projection
    this.map.setView(this.createView())

    return this
  }

  public center(coordinates: Coordinate): this {
    this.map.getView().setCenter(coordinates)
    return this
  }

  public zoom(zoom: number): this {
    this.map.getView().setZoom(zoom)
    return this
  }

  public render(target: string | HTMLElement): this {
    this.map.setTarget(target)
    return this
  }

  private createView(): View {
    let center: Coordinate | undefined
    let zoom: number | undefined
    let rotation: number | undefined

    if (this.map) {
      const view: View = this.map.getView()
      center = view.getCenter()
      zoom = view.getZoom()
      rotation = view.getRotation()
      const projection: Projection = view.getProjection()

      if (center) {
        center = transform(TransformationType.coordinate, center, projection.getCode(), this._projection)
      }
    }

    return new View({
      projection: this._projection,
      center,
      zoom,
      rotation
    })
  }

  private createMap(): Map {
    const osmSource = new OSM()
    return new Map({
      layers: [
        new TileLayer({
          source: osmSource,
        }),
      ],
      controls: [],
      moveTolerance: 2,
      pixelRatio: 2,
      view: this.createView()
    })
  }
}
