const canvas = document.querySelector('.container')

const render = g => {
  const WIDTH = 1000
  const HEIGHT = 1000

  const vec2 = (x, y) => g.createVector(x, y)

  const drawTri = (g, { base, height, stroke = 0, fill = 0, strokeWeight = 0 }) => {
    var halfSide = (2.0 / Math.sqrt(3)) * height * 0.5
    var p = [vec2(base.x - halfSide, base.y), vec2(base.x, base.y - height), vec2(base.x + halfSide, base.y)]
    g.stroke(stroke)
    g.fill(fill)
    g.strokeWeight(strokeWeight)
    g.beginShape()
    g.vertex(p[0].x, p[0].y)
    g.vertex(p[1].x, p[1].y)
    g.vertex(p[2].x, p[2].y)
    g.endShape(g.CLOSE)
  }

  g.setup = () => {
    g.createCanvas(WIDTH, HEIGHT)
    //g.blendMode(g.MULTIPLY)
  }

  g.draw = () => {
    var floor = HEIGHT * 0.5 + 150
    {
      var height = 150
      var base = vec2(WIDTH * 0.5 - 120, floor)
      drawTri(g, { base, height, stroke: g.color(0), fill: g.color(128), strokeWeight: g.strokeWeight(4) })
    }
    {
      var height = 200
      var base = vec2(WIDTH * 0.5 - 200, floor)
      drawTri(g, { base, height, stroke: g.color(0), fill: g.color(255), strokeWeight: g.strokeWeight(4) })
    }
    {
      var height = 300
      var base = vec2(WIDTH * 0.5, floor)
      drawTri(g, { base, height, fill: g.color(0), strokeWeight: g.strokeWeight(4) })
    }
    g.noLoop()
  }
}

new p5(render, canvas)
