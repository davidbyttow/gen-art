const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 500
const NO_FILL = -1
const NO_STROKE = -1
const MIN_MOUNTAIN_WIDTH = 200
const MAX_MOUNTAIN_WIDTH = 400
const MIN_MOUNTAIN_HEIGHT = 100
const MAX_MOUNTAIN_HEIGHT = 500
const MAX_DIST_FROM_CENTER = 300
const MOUNTAIN_NUDGE_DIST = 50
const CANVAS_PADDING = 50
const SUNRISE_TIME = 7
const SUNSET_TIME = 17
const MOONRISE_TIME = 23
const MOONSET_TIME = 4

const ANIMATE = false

const canvas = document.querySelector('.container')

const fourMountains = '0xb1632d2c55291e839408295c8b1099e98c8a32271fbfc40c25a9451626ced519'
const lowerSun = '0xaf7ea21516252479362064cf46e4087a314446088704ee4dd92efe1b06c9be93'

const randomHash = () => {
  let chars = '0123456789abcdef'
  let result = '0x'
  for (let i = 64; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

class Random {
  constructor(seed) {
    this.seed = seed
  }
  randomDec() {
    this.seed ^= this.seed << 13
    this.seed ^= this.seed >> 17
    this.seed ^= this.seed << 5
    return ((this.seed < 0 ? ~this.seed + 1 : this.seed) % 1000) / 1000
  }
  randomBetween(a, b) {
    return a + (b - a) * this.randomDec()
  }
  randomInt(a, b) {
    return Math.floor(this.randomBetween(a, b + 1))
  }
  randomChoice(arr) {
    return arr[Math.floor(this.randomBetween(0, arr.length * 0.99))]
  }
  randomBool() {
    return this.randomChoice([true, false])
  }
  shuffle(array) {
    let index = array.length
    while (index !== 0) {
      let randomIndex = Math.floor(this.randomBetween(0, index * 0.99))
      index -= 1
      let tmp = array[index]
      array[index] = array[randomIndex]
      array[randomIndex] = tmp
    }
    return array
  }
}

const sideFromHeight = h => (2.0 / Math.sqrt(3)) * h
const heightFromSide = s => s / (2.0 / Math.sqrt(3))

const tokenData = { hash: randomHash() }

const lerp = (a, b, t) => a + (b - a) * t

const getFixtures = () => {
  const { hash } = tokenData
  const seed = parseInt(hash.slice(0, 16), 16)
  const rng = new Random(seed)

  let p = []
  for (let i = 0; i < 32; ++i) {
    p.push(tokenData.hash.slice(2 + i * 2, 4 + i * 2))
  }

  let values = p.map(x => parseInt(x, 16))
  console.log(hash, seed, values)
  return { hash, seed, values, rng }
}

const fixtures = getFixtures()
console.log(fixtures)

const getFeatures = () => {
  let { rng, values } = fixtures

  // TODO: Moon/sun time
  let index = 0
  let time = values[index++] % 24

  let numMountains = (values[index++] % 6) + 1
  let mountains = []
  let x = 0

  for (let i = 0; i < numMountains; ++i) {
    let width = lerp(MIN_MOUNTAIN_WIDTH, MAX_MOUNTAIN_WIDTH, values[index++] / 255.0)
    let stroke = 0
    let fill = 0
    mountains.push({ x, width, stroke, fill })
    let nudge = lerp(-MOUNTAIN_NUDGE_DIST, MOUNTAIN_NUDGE_DIST, values[index++] / 255.0)
    x = x + width * 0.5 + nudge
  }

  rng.shuffle(mountains)

  let features = {
    time,
    mountains,
  }

  console.log(features)
  return features
}

const timeScale = (time, min, max) => {
  while (min > max) {
    max += 24
  }
  while (time < min) {
    time += 24
  }
  if (time >= min && time <= max) {
    return (time - min) / (max - min)
  } else {
    return -1
  }
}

const GRAY = -1
const DAY = 0
const NIGHT = 1

const relativeTime = time => {
  let dt = timeScale(time, SUNRISE_TIME, SUNSET_TIME)
  let nt = timeScale(time, MOONRISE_TIME, MOONSET_TIME)
  if (dt >= 0) {
    return { t: dt, type: DAY }
  } else if (nt >= 0) {
    return { t: nt, type: NIGHT }
  }
  return { t: 0, type: GRAY }
}

const render = g => {
  const vec2 = (x, y) => g.createVector(x, y)
  const rect2d = (x, y, width, height) => {
    return { x, y, width, height }
  }

  const brush = (stroke = NO_STROKE, fill = NO_FILL, strokeWeight = 0) => {
    return { stroke, fill, strokeWeight }
  }

  const applyBrush = (g, brush) => {
    const { stroke, fill, strokeWeight } = brush
    let _ = stroke == NO_STROKE ? g.noStroke() : g.stroke(stroke)
    _ = fill == NO_FILL ? g.noFill() : g.fill(fill)
    g.strokeWeight(strokeWeight)
  }

  const drawTri = (g, { base, height, brush }) => {
    var halfSide = sideFromHeight(height) * 0.5
    var p = [vec2(base.x - halfSide, base.y), vec2(base.x, base.y - height), vec2(base.x + halfSide, base.y)]
    g.push()
    applyBrush(g, brush)
    g.beginShape()
    g.vertex(p[0].x, p[0].y)
    g.vertex(p[1].x, p[1].y)
    g.vertex(p[2].x, p[2].y)
    g.endShape(g.CLOSE)
    g.pop()
  }

  const drawCircle = (g, { center, radius, brush }) => {
    g.push()
    applyBrush(g, brush)
    g.circle(center.x, center.y, radius * 2)
    g.pop()
  }

  const drawRect = (g, { rect, brush }) => {
    g.push()
    applyBrush(g, brush)
    g.rect(rect.x, rect.y, rect.width, rect.height)
    g.pop()
  }

  g.setup = () => {
    g.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    //g.blendMode(g.MULTIPLY)
  }

  const { rng } = fixtures
  const features = getFeatures()

  let elapsedTime = 0

  g.draw = () => {
    g.clear()
    const viewRect = rect2d(
      CANVAS_PADDING,
      CANVAS_PADDING,
      CANVAS_WIDTH - CANVAS_PADDING * 2,
      CANVAS_HEIGHT - CANVAS_PADDING * 2
    )
    const center = vec2(CANVAS_WIDTH * 0.5, CANVAS_HEIGHT * 0.5)

    const { mountains } = features
    let { time } = features

    if (ANIMATE) {
      elapsedTime += g.deltaTime * (1 / 1000.0)
      time += elapsedTime
      while (time > 24) {
        time -= 24
      }
    }
    const relTime = relativeTime(time)

    // Compute the scene rectangle
    let sceneRect = rect2d(0, 0, 0, 0)
    mountains.forEach(m => {
      const { x, width } = m
      const height = heightFromSide(width)
      sceneRect.width = Math.max(x + width, sceneRect.width)
      sceneRect.height = Math.max(height, sceneRect.height)
    })

    let scale = 1
    if (sceneRect.width > viewRect.width) {
      scale = viewRect.width / sceneRect.width
    }

    g.push()
    g.translate(center.x - sceneRect.width * 0.5 * scale, center.y - sceneRect.height * 0.5 * scale)
    g.scale(scale)

    //drawRect(g, { rect: sceneRect, brush: brush(128, NO_FILL, 1) })

    // Draw sun or moon
    {
      // const time = 12
      if (relTime.type === DAY) {
        const t = relTime.t
        const radius = lerp(100, 50, Math.sin(t * Math.PI))
        const x = lerp(sceneRect.x + radius, sceneRect.x + sceneRect.width - radius, t)
        const y = sceneRect.height - Math.sin(Math.PI * t) * sceneRect.height
        drawCircle(g, { center: vec2(x, y), radius, brush: brush(-1, g.color(255, 0, 0)) })
      } else if (relTime.type === NIGHT) {
        const t = relTime.t
        const radius = lerp(100, 50, Math.sin(t * Math.PI))
        const x = lerp(sceneRect.x + radius, sceneRect.x + sceneRect.width - radius, t)
        const y = sceneRect.height - Math.sin(Math.PI * t) * sceneRect.height
        drawCircle(g, { center: vec2(x, y), radius, brush: brush(0, 255, 4) })
      }
    }

    // Erase the edges to mask the scene
    {
      g.erase()
      drawRect(g, { rect: rect2d(-CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT), brush: brush(0, 128) })
      drawRect(g, { rect: rect2d(sceneRect.width, 0, CANVAS_WIDTH, CANVAS_HEIGHT), brush: brush(0, 128) })
      drawRect(g, {
        rect: rect2d(-CANVAS_WIDTH, sceneRect.height, CANVAS_WIDTH * 10, CANVAS_HEIGHT),
        brush: brush(0, 128),
      })
      g.noErase()
    }

    // Draw mountains
    {
      mountains.forEach((m, i) => {
        let { x, width } = m
        let height = heightFromSide(width)
        let base = vec2(x + width * 0.5, sceneRect.height)

        let b = brush(255, 200 - i * 30, 6)

        if (relTime.type == DAY) {
          b = brush(0, 255, 6)
        } else if (relTime.type == NIGHT) {
          b = brush(255, 0, 6)
        }

        drawTri(g, { base, height, brush: b })
      })
    }

    g.pop()

    if (!ANIMATE) {
      g.noLoop()
    }
  }
}

new p5(render, canvas)
