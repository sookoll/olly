import LayerGroup from 'ol/layer/Group'
import ImageLayer from 'ol/layer/Image'
import {
  TransformationType,
  addProj,
  coordinateTransforms,
  getProjection,
  pointRotationTransform,
  setProjection,
  transform,
} from '../projection'
import { Extent, getHeight, getWidth } from 'ol/extent'
import { Projection } from 'ol/proj'
import { ImageStatic } from 'ol/source'
import { LayerDef } from '../layer'

export interface KMLGroundOverlayDef extends LayerDef {
  info?: {
    [x: string]: any
  }
}

interface ScreenOverlay {
  name: string
  href: string
}

class KmlGroundOverlayLayer extends LayerGroup {
  options: LayerDef
  url: string | null = null
  loaded: boolean

  constructor(opts: LayerDef) {
    opts.crossOrigin = opts.crossOrigin || 'anonymous'

    super(opts)

    this.options = opts
    if (opts.url) {
      this.url = opts.url
    }
    this.loaded = false
  }

  public setVisible(visible: boolean) {
    super.setVisible(visible)
    if (visible && !this.loaded) {
      this.load()
    }
  }

  private load() {
    if (!this.url) {
      return
    }
    fetch(this.url)
      .then((response) => response.text())
      .then((data: string) => {
        this.parseKml(data)
        this.dispatchEvent('loaded')
      })
      .catch((error) => console.error(error))
      .finally(() => (this.loaded = true))
  }

  private parseKml(data: string) {
    const parser: DOMParser = new DOMParser()
    const xmlDoc: Document = parser.parseFromString(data, 'text/xml')
    const elements: HTMLCollectionOf<Element> =
      xmlDoc.getElementsByTagName('GroundOverlay')
    const legends: HTMLCollectionOf<Element> =
      xmlDoc.getElementsByTagName('ScreenOverlay')
    const path: string = this.url
      ? this.url.slice(0, this.url.lastIndexOf('/') + 1)
      : ''

    for (let i = 0; i < elements.length; i++) {
      const screenOverlay: ScreenOverlay = this.parseNodesToScreenOverlay(
        path,
        elements[i],
      )
      const north: number = Number(
        elements[i].getElementsByTagName('north')[0].childNodes[0].nodeValue,
      )
      const south: number = Number(
        elements[i].getElementsByTagName('south')[0].childNodes[0].nodeValue,
      )
      const east: number = Number(
        elements[i].getElementsByTagName('east')[0].childNodes[0].nodeValue,
      )
      const west: number = Number(
        elements[i].getElementsByTagName('west')[0].childNodes[0].nodeValue,
      )
      let rotation: number = 0
      if (elements[i].getElementsByTagName('rotation').length > 0) {
        rotation = Number(
          elements[i].getElementsByTagName('rotation')[0].childNodes[0]
            .nodeValue,
        )
      }
      if (screenOverlay) {
        this.addLayer(
          screenOverlay.name,
          [west, south, east, north],
          screenOverlay.href,
          rotation,
        )
      }
    }

    const screenOverlays = []

    for (let i = 0; i < legends.length; i++) {
      const screenOverlay: ScreenOverlay = this.parseNodesToScreenOverlay(
        path,
        legends[i],
      )
      screenOverlays.push(screenOverlay)
    }

    this.set('screenOverlays', screenOverlays)
  }

  private parseNodesToScreenOverlay(
    path: string,
    element: Element,
  ): ScreenOverlay {
    let name: string | null = ''
    if (element.getElementsByTagName('name').length > 0) {
      name = element.getElementsByTagName('name')[0].nodeValue || ''
    }

    let href: string | null =
      element.getElementsByTagName('href')[0].childNodes[0].nodeValue || ''
    if (href && href.indexOf('http:') !== 0 && href.indexOf('https:') !== 0) {
      href = path + href
    }

    return { name, href }
  }

  private addLayer(
    name: string,
    extent: Extent,
    url: string,
    rotation: number,
  ) {
    const imageLayer = new ImageLayer({
      properties: { title: name },
    })
    this.getLayers().push(imageLayer)

    const imageSize: number[] = []
    const img = document.createElement('img')
    img.onload = () => {
      imageSize[0] = img.width
      imageSize[1] = img.height
      imageLayer.setSource(
        this.getLayerSource(extent, url, rotation, imageSize),
      )
    }
    img.crossOrigin = this.options.crossOrigin || ''
    img.src = url
  }

  private getLayerSource(
    extent: Extent,
    url: string,
    rotation: number,
    imageSize: number[],
  ): ImageStatic | null {
    const projCode: string = 'EPSG:' + url
    const definition: string =
      '+proj=eqc +lat_ts=' +
      (Math.acos(
        getHeight(extent) / imageSize[1] / (getWidth(extent) / imageSize[0]),
      ) *
        180) /
        Math.PI +
      ' +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'

    let projection: Projection | null = getProjection(projCode)
    if (!projection) {
      setProjection(projCode, definition, extent, 'm')
    }

    projection = getProjection(projCode)
    if (!projection) {
      return null
    }
    // convert the extents to source projection coordinates
    const projExtent = transform(
      TransformationType.extent,
      extent,
      'EPSG:4326',
      projection.getCode(),
    )
    const angle = (-rotation * Math.PI) / 180
    const rotatedProjection = addProj({
      code: 'EPSG:' + url + ':rotation:' + rotation,
      units: 'm',
      extent: projExtent,
    })

    coordinateTransforms(
      'EPSG:4326',
      rotatedProjection,
      (coordinate) => {
        return pointRotationTransform(
          transform(
            TransformationType.coordinate,
            coordinate,
            'EPSG:4326',
            projection?.getCode(),
          ),
          angle,
          projExtent,
        )
      },
      (coordinate) => {
        return transform(
          TransformationType.coordinate,
          pointRotationTransform(coordinate, -angle, projExtent),
          projection?.getCode(),
          'EPSG:4326',
        )
      },
    )

    coordinateTransforms(
      this.options.projection,
      rotatedProjection,
      (coordinate) => {
        return pointRotationTransform(
          transform(
            TransformationType.coordinate,
            coordinate,
            this.options.projection,
            projection?.getCode(),
          ),
          angle,
          projExtent,
        )
      },
      (coordinate) => {
        return transform(
          TransformationType.coordinate,
          pointRotationTransform(coordinate, -angle, projExtent),
          projection?.getCode(),
          this.options.projection,
        )
      },
    )

    return new ImageStatic({
      projection: rotatedProjection,
      url: url,
      imageExtent: projExtent,
      attributions: this.options.attributions,
      crossOrigin: this.options.crossOrigin,
    })
  }
}

export default KmlGroundOverlayLayer
