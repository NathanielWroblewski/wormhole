import Vector from './models/vector.js'
import FourByFour from './models/four_by_four.js'
import Camera from './models/orthographic.js'
import angles from './isomorphisms/angles.js'
import coordinates from './isomorphisms/coordinates.js'
import renderLine from './views/line.js'
import renderCircle from './views/circle.js'
import { seed, noise } from './utilities/noise.js'
import { rand, stableSort, sample, remap } from './utilities/index.js'
import { COLORS, STAR_COLOR } from './constants/colors.js'
import {
  ZOOM, FPS, θdeg, Δθdeg, r, PLANET_CHANCE, MOON_CHANCE, STAR_CHANCE,
  MOON_RADIUS, STAR_RADIUS, PLANET_RADIUS, BOUNDARY_RADIUS, BLUR,
  CYLINDER_Z, NUM_OBJECTS, Δz
} from './constants/dimensions.js'

// Copyright (c) 2020 Nathaniel Wroblewski
// I am making my contributions/submissions to this project solely in my personal
// capacity and am not conveying any rights to any intellectual property of any
// third parties.

const canvas = document.querySelector('.canvas')
const context = canvas.getContext('2d')

const { sin, cos } = Math

const perspective = FourByFour.identity()
  .rotY(angles.toRadians(45))

const camera = new Camera({
  position: Vector.zeroes(),
  direction: Vector.zeroes(),
  up: Vector.from([0, 1, 0]),
  width: canvas.width,
  height: canvas.height,
  zoom: ZOOM
})

seed(Math.random())

const from = Vector.from([0, 0])
const to = Vector.from([180, 360])
const by = Vector.from([1, 1])

const sphericals = []

const θ = angles.toRadians(θdeg)

for (let φdeg = 0; φdeg <= 360; φdeg += Δθdeg) {
  const φ = angles.toRadians(φdeg)

  sphericals.push(Vector.from([r, θ, φ]))
}

context.shadowBlur = BLUR

const ring = (r = 3, φdeg = 45, stroke = sample(COLORS)) => {
  const φ = angles.toRadians(φdeg)
  const points = []
  const results = []

  for (let θdeg = 0; θdeg <= 360; θdeg += 20) {
    const θ = angles.toRadians(θdeg)
    const spherical = Vector.from([r, θ, φ])
    const cartesian = coordinates.toCartesian(spherical)
    const previous = points[points.length - 1]
    const vertices = [previous, cartesian]

    points.push(cartesian)

    if (previous) {
      results.push({
        type: 'line',
        vertices,
        center: cartesian.subtract(previous).divide(2).add(previous),
        stroke,
        opacity: 1
      })
    }
  }

  return results
}

const rings = (rs = [], φdeg = 45) => {
  let colorIndex = rand([0, COLORS.length - 1])

  return rs.reduce((memo, r, index) => {
    if (index) colorIndex = (colorIndex + 2) % (COLORS.length - 1)

    return memo.concat(ring(r, φdeg, COLORS[colorIndex]))
  }, [])
}

const moon = (r = 1, color = sample(COLORS), center = Vector.zeroes()) => {
  return [{
    type: 'circle',
    vertices: [center],
    center,
    stroke: color,
    fill: color,
    radius: r,
    opacity: 1
  }]
}

const planet = center => {
  const φdeg = rand([10, 55])

  return moon(PLANET_RADIUS).concat(rings([2.25, 2.5, 2.75, 3], φdeg)).map(object => ({
    ...object,
    vertices: object.vertices.map(vertex => vertex.add(center)),
    center: object.center.add(center)
  }))
}

let objects = []

const campos = Vector.from([0, 0, -100])

const renderOrderComparator = (a, b) => {
  const a0 = campos.subtract(a.center.transform(perspective))
  const b0 = campos.subtract(b.center.transform(perspective))

  if (a0.z < b0.z) return -1
  if (a0.z > b0.z) return 1
  if (a0.x < b0.x) return -1
  if (a0.x > b0.x) return 1
  if (a0.y < b0.y) return -1
  if (a0.y > b0.y) return 1

  return 0
}

const createObjects = () => {
  const value = Math.random()
  const r = rand([0, BOUNDARY_RADIUS])
  const θ = angles.toRadians(90)
  const φdeg = rand([0, 360])
  const φ = angles.toRadians(φdeg)
  const spherical = Vector.from([r, θ, φ])
  const cartesian = coordinates.toCartesian(spherical).add(Vector.from([0, 0, CYLINDER_Z]))

  if (value > PLANET_CHANCE) {
    return planet(cartesian)
  } else if (value > MOON_CHANCE) {
    return moon(MOON_RADIUS, sample(COLORS), cartesian)
  } else if (value > STAR_CHANCE) {
    return moon(STAR_RADIUS, STAR_COLOR, cartesian)
  } else {
    return []
  }
}

const getOpacity = z => {
  const offset = 10

  if (z < (-CYLINDER_Z + offset)) {
    return remap(z, [-CYLINDER_Z, -CYLINDER_Z + offset], [0, 1])
  } else if (z > (CYLINDER_Z - offset)) {
    return 1 - remap(z, [CYLINDER_Z - offset, CYLINDER_Z], [0, 1])
  } else {
    return 1
  }
}

const render = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)

  perspective.rotY(angles.toRadians(0.1))

  // render cylinder
  const sourcePoints = []
  const destinationPoints = []

  sphericals.forEach((spherical, index) => {
    const cartesianSource = coordinates.toCartesian(spherical).add(Vector.from([0, 0, -CYLINDER_Z]))
    const projectedSource = camera.project(cartesianSource.transform(perspective))
    const cartesianDestination = coordinates.toCartesian(spherical).add(Vector.from([0, 0, CYLINDER_Z]))
    const projectedDestination = camera.project(cartesianDestination.transform(perspective))

    if (index) {
      renderLine(context, projectedSource, sourcePoints[index - 1], '#eeeeee', 1, 0.2)
      renderLine(context, projectedDestination, destinationPoints[index - 1], '#eeeeee', 1, 0.2)
    }

    sourcePoints.push(projectedSource)
    destinationPoints.push(projectedDestination)
  })

  for (let φdeg = 90; φdeg <= 270; φdeg += 180) {
    const φ = angles.toRadians(φdeg)
    const source = coordinates.toCartesian(Vector.from([r, θ, φ])).add(Vector.from([0, 0, -CYLINDER_Z]))
    const destination = coordinates.toCartesian(Vector.from([r, θ, φ])).add(Vector.from([0, 0, CYLINDER_Z]))
    const projectedSource = camera.project(source.transform(perspective))
    const projectedDestination = camera.project(destination.transform(perspective))

    renderLine(context, projectedSource, projectedDestination, '#eeeeee', 1, 0.2)
  }

  // render stars, moons, planets
  stableSort(objects, renderOrderComparator).forEach(object => {
    if (object.center.z < CYLINDER_Z && object.center.z > -CYLINDER_Z) {
      const projected = object.vertices.map(vertex => {
        return camera.project(vertex.transform(perspective))
      })

      const opacity = getOpacity(object.center.z)

      switch (object.type) {
        case 'line':
          return renderLine(context, projected[0], projected[1], object.stroke, 1, opacity)
        case 'circle':
          return renderCircle(context, projected[0], object.radius, object.stroke, object.fill, opacity)
      }
    }
  })

  objects = objects.map(object => ({
    ...object,
    center: object.center.subtract(Vector.from([0, 0, Δz])),
    vertices: object.vertices.map(vertex => vertex.subtract(Vector.from([0, 0, Δz]))),
  })).filter(object => object.center.z > -CYLINDER_Z)

  if (objects.length < NUM_OBJECTS) {
    objects = objects.concat(createObjects())
  }
}

let prevTick = 0

const step = () => {
  window.requestAnimationFrame(step)

  const now = Math.round(FPS * Date.now() / 1000)
  if (now === prevTick) return
  prevTick = now

  render()
}

step()
