const {
  Engine,
  Render,
  Runner,
  World,
  Body,
  Bodies,
  MouseConstraint,
  Mouse,
  Events,
} = Matter

const cellsHorizontal = 15
const cellsVertical = 12
const width = window.innerWidth
const height = window.innerHeight
const unitLengthX = width / cellsHorizontal
const unitLengthY = height / cellsVertical

const engine = Engine.create()
engine.world.gravity.y = 0 // disable gravity
const { world } = engine
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
})

Render.run(render)
Runner.run(Runner.create(), engine)

World.add(
  world,
  MouseConstraint.create(engine, {
    mouse: Mouse.create(render.canvas),
  })
)

// Walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, 20, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 20, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 20, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 20, height, { isStatic: true }),
]
World.add(world, walls)

// Maze Generation
const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false))
const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false))
const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false))

const shuffle = (arr) => {
  let counter = arr.length
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter)
    counter--

    const temp = arr[counter]
    arr[counter] = arr[index]
    arr[index] = temp
  }

  return arr
}

const startRow = Math.floor(Math.random() * cellsVertical)
const startCol = Math.floor(Math.random() * cellsHorizontal)

const stepThroughCell = (row, col) => {
  // Base Case: If I have visited the cell at [row, col] then return
  if (grid[row][col]) {
    return
  }

  // Mark this cell as being visited
  grid[row][col] = true

  // Assemble randomly ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, col, 'up'],
    [row + 1, col, 'down'],
    [row, col + 1, 'right'],
    [row, col - 1, 'left'],
  ])

  // For each neighbor...
  for (const neighbor of neighbors) {
    const [nextRow, nextCol, direction] = neighbor

    // See if that neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextCol < 0 ||
      nextCol >= cellsHorizontal
    ) {
      continue
    }

    // If we have visited that neighbor, continue to next neighbor
    if (grid[nextRow][nextCol]) {
      continue
    }

    // Remove a wall from either horizontals or verticals
    if (direction === 'left') {
      verticals[row][col - 1] = true
    } else if (direction === 'right') {
      verticals[row][col] = true
    } else if (direction === 'up') {
      horizontals[row - 1][col] = true
    } else if (direction === 'down') {
      horizontals[row][col] = true
    }

    // Visit that next cell
    stepThroughCell(nextRow, nextCol)
  }
}

stepThroughCell(startRow, startCol)

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, colIndex) => {
    if (open) {
      return // no wall here
    }

    const wall = Bodies.rectangle(
      colIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      10,
      { label: 'wall', isStatic: true }
    )
    World.add(world, wall)
  })
})

verticals.forEach((row, rowIndex) => {
  row.forEach((open, colIndex) => {
    if (open) {
      return // no wall here
    }

    const wall = Bodies.rectangle(
      colIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      10,
      unitLengthY,
      { label: 'wall', isStatic: true }
    )
    World.add(world, wall)
  })
})

// Goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX / 2,
  unitLengthY / 2,
  { label: 'goal', isStatic: true, render: { fillStyle: 'limegreen' } }
)
World.add(world, goal)

// Ball || User
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: 'ball',
})
World.add(world, ball)

// Keyboard controls
document.addEventListener('keydown', (e) => {
  const { x, y } = ball.velocity
  if (e.code === 'KeyW' || e.code === 'ArrowUp') {
    // Up
    Body.setVelocity(ball, { x, y: y - 5 })
  }

  if (e.code === 'KeyD' || e.code === 'ArrowRight') {
    // Right
    Body.setVelocity(ball, { x: x + 5, y })
  }

  if (e.code === 'KeyS' || e.code === 'ArrowDown') {
    // Down
    Body.setVelocity(ball, { x, y: y + 5 })
  }

  if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
    // Left
    Body.setVelocity(ball, { x: x - 5, y })
  }
})

// Win Condition
Events.on(engine, 'collisionStart', (e) => {
  e.pairs.forEach((collision) => {
    const labels = ['ball', 'goal']

    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.gravity.y = 0.5
      world.bodies.forEach((body) => {
        if (body.label === 'wall') {
          Body.setStatic(body, false)
        }
      })
    }
  })
})
