import LayerImage from 'ol/layer/Image'
import ImageWMS from 'ol/source/ImageWMS'
import { LayerDef, LayerType, WMSLayerDef } from '../layer'
import ImageSource from 'ol/source/Image'

export class ImageLayer extends LayerImage<ImageSource> {
  constructor(opts: LayerDef | WMSLayerDef) {
    let source: ImageSource
    switch (opts.type) {
      case LayerType.ImageWMS:
        source = new ImageWMS(opts)
        break
      default:
        source = new ImageSource(opts)
        break
    }
    super({ source })
  }
}
