const { Engine, Render, Runner, World, Bodies, MouseConstraint, Mouse } = Matter

const cells = 5
const width = 600
const height = 600
const unitLength = width / cells

const engine = Engine.create()
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
  Bodies.rectangle(width / 2, 0, width, 40, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 40, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 40, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 40, height, { isStatic: true }),
]
World.add(world, walls)

// Maze Generation
const grid = Array(cells)
  .fill(null)
  .map(() => Array(cells).fill(false))
const verticals = Array(cells)
  .fill(null)
  .map(() => Array(cells - 1).fill(false))
const horizontals = Array(cells - 1)
  .fill(null)
  .map(() => Array(cells - 1).fill(false))

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

const startRow = Math.floor(Math.random() * cells)
const startCol = Math.floor(Math.random() * cells)

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
    if (nextRow < 0 || nextRow >= cells || nextCol < 0 || nextCol >= cells) {
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
      colIndex * unitLength + unitLength / 2,
      rowIndex * unitLength + unitLength,
      unitLength,
      10,
      { isStatic: true }
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
      colIndex * unitLength + unitLength,
      rowIndex * unitLength + unitLength / 2,
      10,
      unitLength,
      { isStatic: true }
    )
    World.add(world, wall)
  })
})
