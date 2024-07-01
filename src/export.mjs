export const exportMapCanvas = (map) => {
  const canvases = map
    .getViewport()
    .querySelectorAll('.ol-layer canvas, canvas.ol-layer')
  const size = map.getSize()
  const mapCanvas = document.createElement('canvas')
  if (size) {
    mapCanvas.width = size[0]
    mapCanvas.height = size[1]
  }
  const mapContext = mapCanvas.getContext('2d')
  canvases.forEach((canvas) => {
    if (canvas.width > 0) {
      const parentEl = canvas.parentNode
      const opacity =
        parentEl && parentEl.style
          ? parentEl.style.opacity
          : canvas.style.opacity
      if (mapContext) {
        mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity)
      }
      let matrix
      const transform = canvas.style.transform
      if (transform) {
        const matches = transform.match(/^matrix\(([^(]*)\)$/)
        if (matches && matches.length) {
          matrix = matches[1].split(',').map(Number)
        }
      } else {
        matrix = [
          parseFloat(canvas.style.width) / canvas.width,
          0,
          0,
          parseFloat(canvas.style.height) / canvas.height,
          0,
          0,
        ]
      }
      // Apply the transform to the export map context
      if (matrix) {
        mapContext?.setTransform(
          matrix[0],
          matrix[1],
          matrix[2],
          matrix[3],
          matrix[4],
          matrix[5],
        )
        // CanvasRenderingContext2D.prototype.setTransform.apply(
        //   mapContext,
        //   matrix,
        // )
        const backgroundColor = parentEl?.style?.backgroundColor
        if (mapContext && backgroundColor) {
          mapContext.fillStyle = backgroundColor
          mapContext.fillRect(0, 0, canvas.width, canvas.height)
        }
        if (mapContext) {
          mapContext.drawImage(canvas, 0, 0)
        }
      }
    }
  })
  if (mapContext) {
    mapContext.globalAlpha = 1
    mapContext.setTransform(1, 0, 0, 1, 0, 0)
  }
  return mapCanvas
}
