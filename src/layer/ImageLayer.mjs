import LayerImage from 'ol/layer/Image'
import ImageSource from 'ol/source/Image'
import ImageWMS from 'ol/source/ImageWMS'

export class ImageLayer extends LayerImage {
  constructor(opts) {
    let source
    switch (opts.type) {
      case 'ImageWMS':
        source = new ImageWMS(opts)
        break
      default:
        source = new ImageSource(opts)
        break
    }
    super({ source })
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
