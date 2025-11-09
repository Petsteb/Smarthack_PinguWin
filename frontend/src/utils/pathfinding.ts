/**
 * A* Pathfinding Algorithm for 2D floor plan navigation
 */

export interface Point2D {
  x: number;
  z: number;
}

export interface GridNode {
  x: number;
  z: number;
  walkable: boolean;
  g: number; // Cost from start
  h: number; // Heuristic cost to end
  f: number; // Total cost (g + h)
  parent: GridNode | null;
}

export interface ObstacleRect {
  x: number;
  z: number;
  width: number;
  height: number;
}

/**
 * Create a 2D grid for pathfinding
 * @param gridSize - Size of each grid cell in world units
 * @param bounds - World bounds {minX, maxX, minZ, maxZ}
 * @param obstacles - Array of obstacle rectangles
 */
export function createGrid(
  gridSize: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  obstacles: ObstacleRect[]
): GridNode[][] {
  const cols = Math.ceil((bounds.maxX - bounds.minX) / gridSize);
  const rows = Math.ceil((bounds.maxZ - bounds.minZ) / gridSize);

  const grid: GridNode[][] = [];

  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      const worldX = bounds.minX + col * gridSize;
      const worldZ = bounds.minZ + row * gridSize;

      // Check if this grid cell intersects with any obstacle
      const isObstacle = obstacles.some(obs => {
        return (
          worldX < obs.x + obs.width &&
          worldX + gridSize > obs.x &&
          worldZ < obs.z + obs.height &&
          worldZ + gridSize > obs.z
        );
      });

      grid[row][col] = {
        x: worldX + gridSize / 2, // Center of cell
        z: worldZ + gridSize / 2,
        walkable: !isObstacle,
        g: 0,
        h: 0,
        f: 0,
        parent: null,
      };
    }
  }

  return grid;
}

/**
 * Calculate Manhattan distance heuristic
 */
function heuristic(a: GridNode, b: GridNode): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

/**
 * Get neighbors of a node (4-directional)
 */
function getNeighbors(grid: GridNode[][], node: GridNode): GridNode[] {
  const neighbors: GridNode[] = [];
  const gridSize = grid[0] && grid[0][1] ? grid[0][1].x - grid[0][0].x : 1;

  // Find node's grid position
  let nodeRow = -1;
  let nodeCol = -1;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === node) {
        nodeRow = row;
        nodeCol = col;
        break;
      }
    }
    if (nodeRow !== -1) break;
  }

  if (nodeRow === -1) return neighbors;

  // 4 directions: up, right, down, left
  const directions = [
    [-1, 0], // up
    [0, 1],  // right
    [1, 0],  // down
    [0, -1], // left
  ];

  for (const [dr, dc] of directions) {
    const newRow = nodeRow + dr;
    const newCol = nodeCol + dc;

    if (
      newRow >= 0 &&
      newRow < grid.length &&
      newCol >= 0 &&
      newCol < grid[0].length &&
      grid[newRow][newCol].walkable
    ) {
      neighbors.push(grid[newRow][newCol]);
    }
  }

  return neighbors;
}

/**
 * Find the closest walkable node to a target position
 */
function findClosestWalkableNode(
  grid: GridNode[][],
  targetX: number,
  targetZ: number
): GridNode | null {
  let closest: GridNode | null = null;
  let minDist = Infinity;

  for (const row of grid) {
    for (const node of row) {
      if (node.walkable) {
        const dist = Math.sqrt(
          Math.pow(node.x - targetX, 2) + Math.pow(node.z - targetZ, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closest = node;
        }
      }
    }
  }

  return closest;
}

/**
 * A* pathfinding algorithm
 * @param grid - 2D grid of nodes
 * @param startX - Start X position in world coordinates
 * @param startZ - Start Z position in world coordinates
 * @param endX - End X position in world coordinates
 * @param endZ - End Z position in world coordinates
 * @returns Array of points representing the path, or null if no path found
 */
export function findPath(
  grid: GridNode[][],
  startX: number,
  startZ: number,
  endX: number,
  endZ: number
): Point2D[] | null {
  // Reset grid
  for (const row of grid) {
    for (const node of row) {
      node.g = 0;
      node.h = 0;
      node.f = 0;
      node.parent = null;
    }
  }

  // Find start and end nodes (closest walkable nodes to the positions)
  const startNode = findClosestWalkableNode(grid, startX, startZ);
  const endNode = findClosestWalkableNode(grid, endX, endZ);

  if (!startNode || !endNode) {
    console.warn('Could not find walkable start or end node');
    return null;
  }

  const openSet: GridNode[] = [startNode];
  const closedSet: Set<GridNode> = new Set();

  startNode.g = 0;
  startNode.h = heuristic(startNode, endNode);
  startNode.f = startNode.h;

  while (openSet.length > 0) {
    // Find node with lowest f score
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }

    const current = openSet[currentIndex];

    // Check if we reached the goal
    if (current === endNode) {
      // Reconstruct path
      const path: Point2D[] = [];
      let temp: GridNode | null = current;
      while (temp) {
        path.unshift({ x: temp.x, z: temp.z });
        temp = temp.parent;
      }
      return path;
    }

    // Move current from open to closed
    openSet.splice(currentIndex, 1);
    closedSet.add(current);

    // Check neighbors
    const neighbors = getNeighbors(grid, current);
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) {
        continue;
      }

      const tentativeG = current.g + 1; // Cost to move to neighbor

      if (!openSet.includes(neighbor)) {
        openSet.push(neighbor);
      } else if (tentativeG >= neighbor.g) {
        continue; // Not a better path
      }

      // This is the best path so far
      neighbor.parent = current;
      neighbor.g = tentativeG;
      neighbor.h = heuristic(neighbor, endNode);
      neighbor.f = neighbor.g + neighbor.h;
    }
  }

  // No path found
  console.warn('No path found');
  return null;
}

/**
 * Simplify path by removing unnecessary waypoints (Douglas-Peucker algorithm)
 */
export function simplifyPath(path: Point2D[], tolerance: number = 0.5): Point2D[] {
  if (path.length <= 2) return path;

  const douglasPeucker = (points: Point2D[], epsilon: number): Point2D[] => {
    if (points.length <= 2) return points;

    // Find the point with maximum distance from line segment
    let maxDist = 0;
    let index = 0;
    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const dist = perpendicularDistance(points[i], start, end);
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }

    // If max distance is greater than epsilon, recursively simplify
    if (maxDist > epsilon) {
      const left = douglasPeucker(points.slice(0, index + 1), epsilon);
      const right = douglasPeucker(points.slice(index), epsilon);
      return [...left.slice(0, -1), ...right];
    } else {
      return [start, end];
    }
  };

  return douglasPeucker(path, tolerance);
}

/**
 * Calculate perpendicular distance from a point to a line segment
 */
function perpendicularDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const dx = lineEnd.x - lineStart.x;
  const dz = lineEnd.z - lineStart.z;
  const norm = Math.sqrt(dx * dx + dz * dz);

  if (norm === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.z - lineStart.z, 2)
    );
  }

  const u = ((point.x - lineStart.x) * dx + (point.z - lineStart.z) * dz) / (norm * norm);

  if (u < 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.z - lineStart.z, 2)
    );
  } else if (u > 1) {
    return Math.sqrt(
      Math.pow(point.x - lineEnd.x, 2) + Math.pow(point.z - lineEnd.z, 2)
    );
  }

  const closestX = lineStart.x + u * dx;
  const closestZ = lineStart.z + u * dz;
  return Math.sqrt(
    Math.pow(point.x - closestX, 2) + Math.pow(point.z - closestZ, 2)
  );
}
