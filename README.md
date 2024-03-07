# mapwrapper

wrap for ol map

Install:
```bash
npm i ol proj4
npm i @sookoll/mapwrapper
```

Usage:
```javascript
import { Mapwrap, transform } from './main'

const mapwrap = new Mapwrap({
  projection: 'EPSG:3301',
  target: 'map',
})

let blid = null

mapwrap
  .center(transform('fromLonLat', [25, 59.5], 'EPSG:3301'))
  .zoom(5)
  .baseLayer(
    {
      id: 'ma-map',
      label: 'Kaart',
      type: 'XYZ',
      projection: 'EPSG:3301',
      url: 'https://tiles.maaamet.ee/tm/tms/1.0.0/kaart/{z}/{x}/{-y}.png',
    },
    (id) => (blid = id),
  )
  .changeBaseLayer(blid)
  .infoLayer({
    label: 'Mullakaart',
    type: 'TileWMS',
    projection: 'EPSG:3301',
    url: 'https://teenus.maaamet.ee/ows/mullakaart',
    params: {
      LAYERS: 'MULD_VEK_0,MULD_VEK_1,MULD_VEK_2',
      TILED: true,
      FORMAT: 'image/png',
      VERSION: '1.1.1',
    },
    tileSize: 1024,
    gutter: 20,
    visible: true,
    opacity: 0.7,
  })
```