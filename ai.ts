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

type TypeId = string | 'ROCK' | 'PAPER' | 'SCISSORS'

interface Pac {
    pacId: number
    mine: boolean // true if this pac is yours
    x: number // position in the grid
    y: number
    typeId: TypeId  // unused in wood leagues
    speedTurnsLeft: number // unused in wood leagues
    abilityCooldown: number // unused in wood leagues
    targetPellet?: Pellet
    side?: Side
    direction?: {
        x: Direction.LEFT | Direction.RIGHT
        y: Direction.UP | Direction.DOWN
    }
    history?: Point[]
    nearOpponentPac?: {
        pacId: number
        x: number
        y: number
        typeId: TypeId  // unused in wood leagues
        side?: Side
        vector: Point
        distance: number
    }
}

var inputs: string[] = readline().split(' ');
const width: number = parseInt(inputs[0]); // size of the grid
const height: number = parseInt(inputs[1]); // top left corner is (x=0, y=0)
const map: string[] = []
let currentPellet: Pellet
let currentPacs: Pac[] = []
let opponentPacs: Pac[] = []

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

    const calculateDirection = (pac: Pac, target: any): any => {
        const vector = calculateVector(pac.x, pac.y, target.x, target.y)
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

        opponentPacs = pacs.filter(pac => !pac.mine)
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

    const isSamePosition = pac => {
        if (!currentPacs || currentPacs.length === 0 || !currentPacs[pac.pacId]) return false
        return pac.x === currentPacs[pac.pacId].x && pac.y === currentPacs[pac.pacId].y
    }

    const findConflictedPacs = (pac:Pac): Pac[] => {
        return currentPacs
            // .filter(item => item.pacId != pac.pacId) // remove original to compare to
            .filter(isSamePosition)
            .filter(item => {
                return pac.x <= item.x+1 && pac.x >= item.x-1 && pac.y <= item.y+1 && pac.y >= item.y-1
            })
    }

    const getKillType = (typeId: TypeId): TypeId => {
        switch(typeId) {
            case 'ROCK': return 'PAPER'
            case 'PAPER': return 'SCISSORS'
            case 'SCISSORS': return 'ROCK'
            default: return 'ROCK'
        }
    }

    const attack = (pac: Pac): string => {
        // check for situation where pac atack phantom enemy pac
        const vector = calculateVector(pac.x, pac.y, pac.nearOpponentPac.x, pac.nearOpponentPac.y)

        if (isSamePosition(pac) && calculateVectorLength(vector) <= 2) {
            // console.error('fantom')
            opponentPacs = opponentPacs.filter(item => item.pacId !== pac.nearOpponentPac.pacId)
            delete currentPacs[pac.pacId].nearOpponentPac
        }
        return `MOVE ${pac.pacId} ${pac.nearOpponentPac.x} ${pac.nearOpponentPac.y} attack`
    }

    const runAway = (pac: Pac, from: any, returnPoint = false): string|Point => {
        const direction = calculateDirection(pac, from)
        let newX = direction.x === Direction.LEFT ? (pac.x + 4) : (pac.x - 4) // TODO: double check
        let newY = direction.y === Direction.DOWN ? (pac.y - 4) : (pac.y + 4)

        if (newX < 1) newX = 1
        if (newY < 1) newY = 1
        if (newX >= width) newX = width  - 1
        if (newY >= height) newY = height - 2

        // console.error('runaway pac: ' + pac.pacId + `${direction.y} ${newX} ${newY}  ${returnPoint}`)
        if (returnPoint) {
            return { x: newX, y: newY }
        }
        return `MOVE ${pac.pacId} ${newX} ${newY} run`
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

    let output: string = ''
    let outputComment: string = ''

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
                outputComment = `maze` // mark pac it use maze for finsing pellet
            } else {
                currentPellet = getNextPellet(sortedPelletsPerPac)
            }

            if (output.length > 1) {
                output += ` | `
            }
            if (isSamePosition(pac)) {
                // console.error("same position")
                // [...Array(3)].forEach(() => {
                //     currentPellet = getNextPellet(sortedPelletsPerPac)
                // })
                currentPellet = getNextPelletFromMaze(pac)

                const conflictedPacs = findConflictedPacs(pac)
                if (conflictedPacs.length) {
                    // console.error("conflictedPacs")
                    const conflictedPac = conflictedPacs.pop()
                    if ( // in case the direction is still opposite (conflicting) choose same pellet
                        conflictedPac.direction.x !== calculateDirection(pac, currentPellet).x ||
                        conflictedPac.direction.y !== calculateDirection(pac, currentPellet).y
                    ) {
                        currentPellet = conflictedPac.targetPellet
                    }

                    if (pac.typeId === conflictedPac.typeId) {
                        // console.error("same type collision")
                        // very rare case that pellet is between my own packs
                        currentPellet = {
                            ...runAway(pac, conflictedPac, true) as Point,
                            value: 5
                        }
                    }

                }

            }

            // update my packs with information about distance to the nearest opponent pac (plus set type)
            if(opponentPacs.length) {
                opponentPacs.forEach((opponentPac: Pac) => {
                    const vector = calculateVector(pac.x, pac.y, opponentPac.x, opponentPac.y)
                    const distance = calculateVectorLength(vector)
                    if (
                        !pac.nearOpponentPac
                        || (pac.nearOpponentPac && pac.nearOpponentPac.distance > distance)
                    ) {
                        pac.nearOpponentPac = {
                            pacId: opponentPac.pacId,
                            x: opponentPac.x,
                            y: opponentPac.y,
                            typeId: opponentPac.typeId,
                            vector: vector,
                            distance: distance
                        }
                    }
                })
            }

            if (pac.speedTurnsLeft === 0 && pac.abilityCooldown === 0) {
                // check for opponent pacs
                // morph & attack :)

                if (pac.nearOpponentPac && pac.nearOpponentPac.distance < 5) {
                    const winingType: TypeId = getKillType(pac.nearOpponentPac.typeId)
                    if (pac.typeId === winingType) { // attack the fucker
                        output += attack(pac)
                    } else { // morph
                        output += `SWITCH ${pac.pacId} ${winingType}`
                    }
                } else {

                    if (pac.nearOpponentPac && pac.nearOpponentPac.distance > 6 ) {
                        // no enemy pacs around so maybe speed up? :)
                        output += `SPEED ${pac.pacId}`
                    } else {
                        output += `MOVE ${pac.pacId} ${currentPellet.x} ${currentPellet.y} ${outputComment}`
                    }
                }

            } else {

                if (pac.nearOpponentPac && pac.nearOpponentPac.distance <3) {
                    const winingType: TypeId = getKillType(pac.nearOpponentPac.typeId)

                    if (pac.typeId === winingType) { // attack the fucker
                        output += attack(pac)
                    }

                    // TODO: this might be dangerous in future
                    if (pac.typeId === pac.nearOpponentPac.typeId) { // same type
                        output += `MOVE ${pac.pacId} ${currentPellet.x} ${currentPellet.y} ${outputComment}`
                    }

                    if (getKillType(pac.typeId) === pac.nearOpponentPac.typeId) { // run away
                        output += runAway(pac, pac.nearOpponentPac)
                    }

                } else {

                    if (outputComment.length === 0) {
                        outputComment = `${currentPellet.side}`
                    }

                    output += `MOVE ${pac.pacId} ${currentPellet.x} ${currentPellet.y} ${outputComment}`
                }
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

     // console.error(currentPacs.map(x => ({...x, history: []})))

    // // print maze
    // cleanMazeBasedOnPacsHistory()
    // map.forEach(i => console.error(i))

    console.log(output)



}
