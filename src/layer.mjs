import { deepCopy, uid } from './utilities'
import { setProjection } from './projection.mjs';

export const set = (layer, opts) => {
  if (!layer) {
    return
  }
  if (typeof opts.visible === 'boolean') {
    layer.setVisible(opts.visible)
  }
  if (typeof opts.id === 'undefined') {
    opts.id = uid()
  }
  layer.set('id', opts.id)
  if (typeof opts.label !== 'undefined') {
    layer.set('label', opts.label)
  }
  if (typeof opts.type !== 'undefined') {
    layer.set('type', opts.type)
  }
  if (typeof opts.icon !== 'undefined') {
    layer.set('icon', opts.icon)
  }
  if (typeof opts.minResolution !== 'undefined') {
    layer.setMinResolution(Number(opts.minResolution))
  }
  if (typeof opts.maxResolution !== 'undefined') {
    layer.setMaxResolution(Number(opts.maxResolution))
  }
  if (typeof opts.minZoom !== 'undefined') {
    layer.setMinZoom(Number(opts.minZoom))
  }
  if (typeof opts.maxZoom !== 'undefined') {
    layer.setMaxZoom(Number(opts.maxZoom))
  }
  if (typeof opts.opacity !== 'undefined') {
    layer.setOpacity(Number(opts.opacity))
  }
  if (typeof opts.zIndex !== 'undefined') {
    layer.setZIndex(Number(opts.zIndex))
  }
  if ('clusters' in opts) {
    layer.set('clusters', opts.clusters)
  }
  layer.set('conf', opts)

  return layer
}

export const createLayer = async (def) => {
  let layer
  if ('projection' in def) {
    setProjection(def.projection)
  }
  switch (def.type) {
    case 'Group': {
      const { GroupLayer } = await import('./layer/GroupLayer')
      const arr = def.layers
        ? def.layers.map((conf) => {
            const inputConf = deepCopy(conf)
            // add projection to sublayer
            if (!inputConf.projection) {
              inputConf.projection = def.projection
            }
            if (!inputConf.zIndex && def.zIndex) {
              inputConf.zIndex = def.zIndex
            }
            return createLayer(inputConf)
          })
        : []
      // group should be visible, if not specified
      if (typeof def.visible === 'undefined') {
        def.visible = true
      }
      layer = new GroupLayer({
        layers: arr,
      })
      break
    }
    case 'OSM': {
      const { OsmLayer } = await import('./layer/OsmLayer')
      layer = new OsmLayer(deepCopy(def))
      break
    }
    case 'XYZ':
    case 'TMS': {
      const { TileLayer } = await import('./layer/TileLayer')
      layer = new TileLayer(deepCopy(def))
      break
    }
    case 'TileWMS': {
      const { TileWmsLayer } = await import('./layer/TileWmsLayer')
      if ('params' in def) {
        layer = new TileWmsLayer(deepCopy(def))
      }
      break
    }
    case 'ImageWMS': {
      const { ImageLayer } = await import('./layer/ImageLayer')
      layer = new ImageLayer(deepCopy(def))
      break
    }
    case 'Features':
    case 'FeatureCollection': {
      if (def.renderer && def.renderer === 'webgl') {
        const { WGLFeatureLayer } = await import('./layer/WGLFeatureLayer')
        layer = new WGLFeatureLayer(deepCopy(def))
      } else if (def.clusters) {
        const { ClusterFeatureLayer } = await import(
          './layer/ClusterFeatureLayer'
        )
        layer = new ClusterFeatureLayer(deepCopy(def))
      } else {
        const { FeatureLayer } = await import('./layer/FeatureLayer')
        layer = new FeatureLayer(deepCopy(def))
      }
      break
    }
    case 'FeatureImage': {
      if (def.renderer && def.renderer === 'webgl') {
        const { WGLFeatureLayer } = await import('./layer/WGLFeatureLayer')
        layer = new WGLFeatureLayer(deepCopy(def))
      } else {
        const { FeatureImageLayer } = await import('./layer/FeatureImageLayer')
        layer = new FeatureImageLayer(deepCopy(def))
      }
      break
    }
    case 'Directus': {
      const { DirectusLayer } = await import('./layer/DirectusLayer')
      layer = new DirectusLayer(deepCopy(def))
      break
    }
    case 'FeatureVT': {
      const { FeatureVTLayer } = await import('./layer/FeatureVTLayer')
      layer = new FeatureVTLayer(deepCopy(def))
      break
    }
    case 'MVT': {
      const { MVTLayer } = await import('./layer/MVTLayer')
      layer = new MVTLayer(deepCopy(def))
      break
    }
  }
  if (!layer) {
    return false
  }
  set(layer, def)

  return layer
}
