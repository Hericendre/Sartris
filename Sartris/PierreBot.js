function createKey(a, b) {
    return `${a >= 0 ? "+" : ""}${a}${b >= 0 ? "+" : ""}${b}`
}

function readKey(key) {
    return [key.slice(0, 2), key.slice(2, 4), key[4]]
}

class Bot {
    constructor(grid, disp=false) {
        this.grid = grid || new SartrisGrid()
        this.display=disp
        this.dead=false
    }
    test_move(name, x, direction, y = 18) {
        while (this.grid.is_free2(x, y + 1, direction, name)) {
            y++
        }
        let piece = this.grid.get_minos({ name, x, y, direction })
        let new_grid = JSON.parse(JSON.stringify(this.grid.grid))
        let lines_cleared = 0
        for (let [x, y] of piece) {
            if (x < this.grid.width && y < this.grid.height) {
                new_grid[y][x] = name
            }
        }
        for (let row = 0; row < this.grid.height; row++) {
            if (!new_grid[row].includes('')) {
                lines_cleared++
                for (let i = row; i > 0; i--) {
                    new_grid[i] = [...new_grid[i - 1]]
                }
            }
        }
        return [new_grid, lines_cleared]
    }
    test_all_moves(y = 18) {
        let possible_moves = {}
        for (let hold = 0; hold <= 1; hold++) {
            let name = hold ? (this.grid.hold ? this.grid.hold : this.grid.bag[0]) : this.grid.piece.name
            for (let direction = 0; direction <= 3; direction++) {
                for (let x = -2; x <= 9; x++) {
                    if (this.grid.is_free2(x, 18, direction, name)) {
                        possible_moves[createKey(x, direction) + hold] = this.test_move(name, x, direction, y)
                    }
                }
            }
        }
        return possible_moves
    }
    place(x, direction, hold) {
        if (hold == "1") this.grid.swap_hold()
        while (this.grid.piece.direction > direction) { this.grid.ccw() }
        while (this.grid.piece.direction < direction) { this.grid.cw() }
        let move=0
        while (this.grid.piece.x > x && move<10) { this.grid.left() 
            move++
            if (move==9) this.dead=true 
        }
        while (this.grid.piece.x < x && move<10) { this.grid.right() 
            move++
            if (move==9) this.dead=true 
        }
        if (this.display){this.dead=place_piece()}
        else {
            this.grid.harddrop()
        this.dead=this.grid.game_over
        }
    }
    choose(){
        this.place(...readKey("+3+00"))
    }
}
let default_weights={
    holes:-70,
    highest:-0.5,
    flatness:5,
    i_dep:-25,
    right_column:-25,
    single:-35,
    double:-30,
    triple:-20,
    tetris:5}
class PierreBot extends Bot {
    constructor(grid, display=false, weights=default_weights){
        super(grid, display)
        this.weights=weights
    }
    counters(grid, line_clear) {
        let single = line_clear == 1
        let double = line_clear == 2
        let triple = line_clear == 3
        let tetris = line_clear == 4
        let columns_heights = []
        for (let i = 0; i < this.grid.width; i++) columns_heights.push(39)
        let holes = 0
        let right_column = 0
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                if (grid[y][x]) {
                    if (y < columns_heights[x]) columns_heights[x] = y
                    if (x == this.grid.width - 1) right_column = 1
                }
                else if (y > columns_heights[x]) { holes += y - columns_heights[x] }
            }
        }
        columns_heights = columns_heights.map(x => 39 - x)
        let highest = Math.max(...columns_heights)**2
        let relative_heights = []
        let flatness = 0
        let i_dep = 0

        for (let i = 0; i < this.grid.width - 2; i++) {
            let relative_height = Math.abs(columns_heights[i + 1] - columns_heights[i])
            flatness += 1 - relative_height
            relative_heights.push(relative_height)
        }
        if (relative_heights[0] >= 3) i_dep += relative_heights[0] - 2
        if (relative_heights[this.grid.width - 2] >= 3) i_dep += relative_heights[this.grid.width - 2] - 2
        for (let i = 0; i < this.grid.width - 2; i++) {
            if (relative_heights[i] >= 3 && relative_heights[i + 1] >= 3) i_dep += Math.min(relative_heights[i], relative_heights[i + 1]) - 2
        }
        return {highest, holes, flatness, i_dep, right_column, single, double, triple, tetris}

    }
    get_score(grid) {
        let counters = this.counters(...grid)
        return Object.keys(counters).reduce((x,y)=>x+counters[y]*this.weights[y],0)
    }
    choose() {
        let moves = this.test_all_moves(this.grid.piece.y)
        let moves_keys = Object.keys(moves)
        let best_move = moves_keys[0]
        let best_score = this.get_score(moves[best_move])
        for (let move of moves_keys) {
            let score = this.get_score(moves[move])
            if (score > best_score) {
                best_move = move
                best_score = score
            }
        }
        // console.log(this.counters(...moves[best_move]))
        this.place(...readKey(best_move))
    }
}
let pierre = new PierreBot(grid,display=true)
let pierre_timeout = 1
function play(bot, delay) {
    if (pierre_timeout && !bot.dead) {
        bot.choose()
        // requestAnimationFrame(() => play(bot))
        pierre_timeout = setTimeout(() => play(bot, delay), delay)
    }
}

document.addEventListener("keydown", function (event) {
    if (event.key == "=") {
        // pierre_timeout = 1;
        play(pierre,0)
    }
})
document.addEventListener("keydown", function (event) {
    if (event.key == ")") {
        // pierre_timeout = 0;
        clearTimeout(pierre_timeout)
    }
})
// while(pierre.grid.placed_pieces<1000){
//     pierre.choose()
// }
// console.log(pierre.grid.score)

function evaluate_once(Bot, n=1000, weights){
    let bot=new Bot(new SartrisGrid(), false, weights)
    while (bot.grid.placed_pieces<n && !bot.dead){
        bot.choose()
    }
    return bot.grid.score
}

function evaluate_n(Bot, weights,n=10, tries=1000){
    let scores=[]
    for(let i=0;i<n;i++){
        scores.push(evaluate_once(Bot, tries,weights))
    }
    return scores.reduce((x,y)=>x+y)/scores.length
}

function random_weights(weights){
    let new_weights={}
    for(let weight of Object.keys(weights)){
        new_weights[weight]=(0.5+Math.random())*weights[weight]
    }
    return new_weights
}

function merge_weights(...bots_results){
    let weights={}
    for (let weight of Object.keys(bots_results[0].weights)){
        weights[weight]=bots_results.reduce(x=>x.weights[weight])
    }
    return weights
}

function new_gen(weights, n=10){
    let bots_results=[]
    for (let i = 0;i<n;i++){
        let new_weights=random_weights(weights)
        let score = evaluate_n(PierreBot, weights,20,500)
        bots_results.push({weights:new_weights,score})
        console.log(bots_results)
    }
    bots_results=bots_results.sort((a,b)=>b.score-a.score)
    console.log(bots_results)
    return merge_weights(bots_results[0], bots_results[1])
}

