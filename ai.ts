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
    typeId: string // unused in wood leagues
    speedTurnsLeft: number // unused in wood leagues
    abilityCooldown: number // unused in wood leagues
    targetPellet?: Pellet
    side?: Side
    direction?: Direction
}


var inputs: string[] = readline().split(' ');
const width: number = parseInt(inputs[0]); // size of the grid
const height: number = parseInt(inputs[1]); // top left corner is (x=0, y=0)
for (let i = 0; i < height; i++) {
    const row: string = readline(); // one line of the grid: space " " is floor, pound "#" is wall
}

let currentPellet: Pellet
let currentPacs: Pac[] = []

// game loop
while (true) {
    var inputs: string[] = readline().split(' ');
    const myScore: number = parseInt(inputs[0]);
    const opponentScore: number = parseInt(inputs[1]);
    const visiblePacCount: number = parseInt(readline()); // all your pacs and enemy pacs in sight

    const calculateSide = (x:number): Side => {
        return Math.round(x/width) ? Side.RIGHT : Side.LEFT
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
    }

    const getSuperPellets = (pellets: Pellet[]) => {
        return pellets.filter(x => x.value == 10)
    }

    const getNextPellet = () => {
        if (getSuperPellets(pellets).length > 0) {
            return getSuperPellets(pellets).pop() as Pellet
        } else {
            return pellets.pop()
        }
    }

    let output: string = ''

    const isSamePosition = pac => {
        if (!currentPacs || currentPacs.length === 0 || !currentPacs[pac.pacId]) return false
        return pac.x === currentPacs[pac.pacId].x && pac.y === currentPacs[pac.pacId].y
    }


    pacs
        .filter(pac => pac.mine)
        .forEach(pac => {
            currentPellet = getNextPellet()

            if (output.length > 1) {
                output += ` | `
            }
            if (isSamePosition(pac)) {
                console.error('same position')
                console.error(currentPacs)
                for (let i; i < Math.random()*5; i++) {
                    currentPellet = getNextPellet()
                }
            }
            output += `MOVE ${pac.pacId} ${currentPellet.x} ${currentPellet.y} ${currentPellet.side}`



            currentPacs[pac.pacId] = {...pac, targetPellet: currentPellet}
        })

    console.log(output)


    // Write an action using console.log()
    // To debug: console.error('Debug messages...');


}
