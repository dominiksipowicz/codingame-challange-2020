/**
 * Grab the pellets as fast as you can!
 **/

enum Side { LEFT = 'left', RIGHT = 'right' }
enum Direction {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right'
}

interface Point {
    x: number
    y: number
}

interface Pellet {
    x: number // position in the grid
    y: number
    value: number // 1 or 10 (super pellet)
    side?: Side
}

interface Pac {
    pacId: number
    mine: boolean // true if this pac is yours
    x: number // position in the grid
    y: number
    typeId: string | 'ROCK' | 'PAPER' | 'SCISSORS'  // unused in wood leagues
    speedTurnsLeft: number // unused in wood leagues
    abilityCooldown: number // unused in wood leagues
    targetPellet?: Pellet
    side?: Side
    direction?: {
        x: Direction.LEFT | Direction.RIGHT
        y: Direction.UP | Direction.DOWN
    }
    history?: Point[]
}

var inputs: string[] = readline().split(' ');
const width: number = parseInt(inputs[0]); // size of the grid
const height: number = parseInt(inputs[1]); // top left corner is (x=0, y=0)
const map: string[] = []
let currentPellet: Pellet
let currentPacs: Pac[] = []

for (let i = 0; i < height; i++) {
    const row: string = readline(); // one line of the grid: space " " is floor, pound "#" is wall
    map.push(row.replace(/\s/g, '?'))
}

// game loop
while (true) {
    var inputs: string[] = readline().split(' ');
    const myScore: number = parseInt(inputs[0]);
    const opponentScore: number = parseInt(inputs[1]);
    const visiblePacCount: number = parseInt(readline()); // all your pacs and enemy pacs in sight

    const calculateSide = (x:number): Side => {
        return Math.round(x/width) ? Side.RIGHT : Side.LEFT
    }

    const calculateVector = (x1 ,y1, x2, y2): Point => {
        return {
            x: x2 - x1,
            y: y2 - y1
        }
    }

    const calculateVectorLength = (point: Point): number => {
        return Math.sqrt(point.x * point.x + point.y * point.y);
    }

    const calculateDirection = (pac: Pac, pellet: Pellet): any => {
        const vector = calculateVector(pac.x, pac.y, pellet.x, pellet.y)
        return {
            x: vector.x > 0 ? Direction.RIGHT : Direction.LEFT,
            y: vector.y > 0 ? Direction.DOWN : Direction.UP,
        }
    }

    let pacs: Pac[] = []

    for (let i = 0; i < visiblePacCount; i++) {
        var inputs: string[] = readline().split(' ');

        const pac: Pac = {
            pacId: parseInt(inputs[0]),
            mine: inputs[1] !== '0',
            x: parseInt(inputs[2]),
            y: parseInt(inputs[3]),
            typeId: inputs[4],
            speedTurnsLeft: parseInt(inputs[5]),
            abilityCooldown: parseInt(inputs[6]),
            side: calculateSide(parseInt(inputs[2]))
        }
        pacs.push(pac)
    }
    const visiblePelletCount: number = parseInt(readline()); // all pellets in sight

    const updateMazeWithVisualPelets = (pellet: Pellet) => {
        const row = map[pellet.y]
        const spot: string = pellet.value === 10 ? 'O' : 'o'
        map[pellet.y] = row.substring(0, pellet.x) + spot + row.substring(pellet.x + 1);
    }

    const cleanMazeBasedOnPacsHistory = () => {
        currentPacs
            .forEach(pac => {
                pac.history.forEach(point => {
                    const row = map[point.y]
                    const spot: string = ' '
                    map[point.y] = row.substring(0, point.x) + spot + row.substring(point.x + 1);
                })
            })
    }

    const getNextPelletFromMaze = (pac: Pac): Pellet => {

        cleanMazeBasedOnPacsHistory()

        const side: Side = (pac.pacId % 2 === 0) ? Side.LEFT : Side.RIGHT

        let point: Pellet;

        map.forEach((row, n) => {
            row.split('').forEach((item, index) => {
                if (side === calculateSide(index)) {
                    if (item === 'O') {
                        point = {x: index, y: n, value: 10}
                        return
                    }
                    if (item === 'o') {
                        point = {x: index, y: n, value: 1}
                        return
                    }
                }
            })
        })

        return point
    }

    let pellets: Pellet[] = []

    for (let i = 0; i < visiblePelletCount; i++) {
        var inputs: string[] = readline().split(' ');
        const pellet: Pellet = {
            x: parseInt(inputs[0]),
            y: parseInt(inputs[1]),
            value: parseInt(inputs[2]),
            side: calculateSide(parseInt(inputs[0]))
        }
        pellets.push(pellet)
        updateMazeWithVisualPelets(pellet)
    }

    const getSuperPellets = (pellets: Pellet[]) => {
        return pellets.filter(x => x.value == 10)
    }

    const superPeletsCount = getSuperPellets(pellets).length

    const getNextPellet = (individualPacPellets: Pellet[]): Pellet => {

        // first super pellets priority so if one left - jump all on it
        if (superPeletsCount === 1) {
            return getSuperPellets(pellets)[0] as Pellet
        }

        if (getSuperPellets(individualPacPellets).length > 0) {
            const lastSuperPellet = getSuperPellets(individualPacPellets)[0] as Pellet
            const index = pellets.indexOf(lastSuperPellet);
            if (index > -1) {
                pellets.splice(index, 1);
            }
            return lastSuperPellet
        } else {
            return individualPacPellets.shift() as Pellet
        }
    }

    let output: string = ''

    const isSamePosition = pac => {
        if (!currentPacs || currentPacs.length === 0 || !currentPacs[pac.pacId]) return false
        return pac.x === currentPacs[pac.pacId].x && pac.y === currentPacs[pac.pacId].y
    }

    const findConflictedPacs = (pac:Pac): Pac[] => {
        return currentPacs
            // .filter(item => item.pacId != pac.pacId) // remove original to compare to
            .filter(item => {
                return pac.x <= item.x+1 && pac.x >= item.x-1 && pac.y <= item.y+1 && pac.y >= item.y-1
            })
    }

/*
 * STRATEGY:
 *      - collect super pellets first
 *      - calculate distance per pac
 *      - collect the nearest pellets
 *      - if conflict use:
 *          - random
 *          - opposite direction
 */

    pacs
        .filter(pac => pac.mine)
        .forEach(pac => {

            // sorting pellets by distance between current pac and pellets
            const sortedPelletsPerPac: Pellet[] = [...pellets].sort((a: Pellet, b: Pellet) => {
                const lengthA = calculateVectorLength(calculateVector(a.x, a.y, pac.x, pac.y))
                const lengthB = calculateVectorLength(calculateVector(b.x, b.y, pac.x, pac.y))
                return lengthA - lengthB
            })

            if (sortedPelletsPerPac.length === 0) {
                currentPellet = getNextPelletFromMaze(pac)
            } else {
                currentPellet = getNextPellet(sortedPelletsPerPac)
            }

            if (output.length > 1) {
                output += ` | `
            }
            if (isSamePosition(pac)) {
                // console.error(findConflictedPacs(pac))
                // [...Array(3)].forEach(() => {
                //     currentPellet = getNextPellet(sortedPelletsPerPac)
                // })
                currentPellet = getNextPelletFromMaze(pac)

                const conflictedPac = findConflictedPacs(pac).filter(item => item.mine).shift()

                if ( // in case the direction is still opposite (conflicting) choose same pellet
                    conflictedPac.direction.x !== calculateDirection(pac, currentPellet).x ||
                    conflictedPac.direction.y !== calculateDirection(pac, currentPellet).y
                ) {
                    currentPellet = conflictedPac.targetPellet
                }

                // console.error(findConflictedPacs(pac).map(x => ({...x, history: []})))

            }

            if (pac.speedTurnsLeft === 0 && pac.abilityCooldown === 0) {
                output += `SPEED ${pac.pacId}`
            } else {
                output += `MOVE ${pac.pacId} ${currentPellet.x} ${currentPellet.y} ${currentPellet.side}`
            }

            const history = currentPacs[pac.pacId]
                ? currentPacs[pac.pacId].history
                : []

            currentPacs[pac.pacId] = {
                ...pac,
                targetPellet: currentPellet,
                side: calculateSide(pac.x),
                direction: calculateDirection(pac, currentPellet),
                history: [...history, {x: pac.x, y: pac.y }]
            }

            // console.error(findConflictedPacs(pac).map(x => ({...x, history: []})))
        })

    //  console.error(currentPacs.map(x => ({...x, history: []})))

    // // print maze
    // cleanMazeBasedOnPacsHistory()
    // map.forEach(i => console.error(i))

    console.log(output)



}
