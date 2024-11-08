import VectorTileLayer from 'ol/layer/VectorTile'
import VectorTileSource from 'ol/source/VectorTile'
import { DEFAULT_PROJECTION, DEFAULT_STYLE } from '../defaults.mjs'
import { TopoJSON, GeoJSON } from 'ol/format'
import geojsonvt from 'geojson-vt'
import Projection from 'ol/proj/Projection'

export class FeatureVTLayer extends VectorTileLayer {
  constructor(opts) {
    const source = new VectorTileSource({
      tileUrlFunction: (tileCoord) => {
        // Use the tile coordinate as a pseudo URL for caching purposes
        return JSON.stringify(tileCoord)
      },
    })
    super({
      source,
      style: opts.style || DEFAULT_STYLE,
    })

    this.featureProjection = opts.mapProjection || DEFAULT_PROJECTION

    if (opts.url) {
      this.load(opts.url)
        .then((json) => this.parseGeoJSON(json))
        .then((geojson) => this.setSourceTileLoadFunction(geojson))
    }
  }

  async load(url) {
    const response = await fetch(url)
    return await response.json()
  }

  async parseGeoJSON(json) {
    // if it's geojson FeatureCollection
    if (json && json.type === 'FeatureCollection' && json.features) {
      return json
    }
    // if it's topojson
    if (json && json.type === 'Topology' && json.objects) {
      const features = new TopoJSON().readFeatures(json)
      return new GeoJSON().writeFeaturesObject(features)
    }

    return null
  }

  setSourceTileLoadFunction(geojson) {
    const source = this.getSource()
    const tileIndex = geojsonvt(geojson, {
      extent: 4096,
      debug: 1,
    })
    const format = new GeoJSON({
      // Data returned from geojson-vt is in tile pixel units
      dataProjection: new Projection({
        code: 'TILE_PIXELS',
        units: 'tile-pixels',
        extent: [0, 0, 4096, 4096],
      }),
    })

    source.setTileLoadFunction((tile, url) => {
      const tileCoord = JSON.parse(url)
      const data = tileIndex.getTile(tileCoord[0], tileCoord[1], tileCoord[2])
      const geojson = JSON.stringify(
        {
          type: 'FeatureCollection',
          features: data ? data.features : [],
        },
        this.replacer,
      )
      const features = format.readFeatures(geojson, {
        extent: source.getTileGrid().getTileCoordExtent(tileCoord),
        featureProjection: this.featureProjection,
      })
      tile.setFeatures(features)
    })
  }

  // Converts geojson-vt data to GeoJSON
  replacer(key, value) {
    if (!value || !value.geometry) {
      return value
    }

    let type
    const rawType = value.type
    let geometry = value.geometry
    if (rawType === 1) {
      type = 'MultiPoint'
      if (geometry.length === 1) {
        type = 'Point'
        geometry = geometry[0]
      }
    } else if (rawType === 2) {
      type = 'MultiLineString'
      if (geometry.length === 1) {
        type = 'LineString'
        geometry = geometry[0]
      }
    } else if (rawType === 3) {
      type = 'Polygon'
      if (geometry.length > 1) {
        type = 'MultiPolygon'
        geometry = [geometry]
      }
    }

    return {
      type: 'Feature',
      geometry: {
        type: type,
        coordinates: geometry,
      },
      properties: value.tags,
    }
  }
}
