function shuffle(array) {
    let new_array = []
    let array_copy = Array.from(array)
    while (array_copy.length > 0) {
        index = Math.floor(Math.random() * array_copy.length)
        new_array.push(array_copy.splice(index, 1)[0])
    }
    return new_array
}

class SartrisGrid {
    constructor(height = 40, visible_height = 20, width = 10) {
        this.height = height
        this.visible_height = visible_height
        this.width = width
        this.grid = []
        for (let i = 0; i < this.height; i++) {
            let row = []
            for (let j = 0; j < this.width; j++) {
                row.push('')
            }
            this.grid.push(row)
        }
        this.gravity_info = {
            last_reset: undefined,
            last_godown: Date.now(),
            resets: 0,
            lowest_row: 0
        }
        this.bag = shuffle(["l", "j", "s", "z", "t", "o", "i"])
        this.next_bag = shuffle(["l", "j", "s", "z", "t", "o", "i"])
        this.piece = { name: this.bag.shift(), direction: 0, x: 3, y: 18 }
        this.godown()
        this.hold = undefined
        this.game_over = false
        this.cleared_lines = 0
        this.placed_pieces = 0
        this.hold_used = false
        this.score = 0
        this.last_movement = undefined
        this.score_table = {
            "0": 10,
            "1": 100,
            "2": 300,
            "3": 500,
            "4": 800,
            "tm0":100,
            "tm1":200,
            "tm2":400,
            "t0": 400,
            "t1": 800,
            "t2": 1200,
            "t3": 1600
        }
        this.clear = "0"
        this.b2b=0
    }
    next_piece() {
        this.piece = { name: this.bag.shift(), direction: 0, x: 3, y: 18 }
        if (this.bag.length == 0) {
            this.bag = this.next_bag
            this.next_bag = shuffle(["l", "j", "s", "z", "t", "o", "i"])
        }
        this.gravity_info = {
            last_reset: undefined,
            last_godown: Date.now(),
            resets: 0,
            lowest_row: 0
        }
    }
    lock() {
        let piece = this.get_minos(this.piece)
        this.placed_pieces += 1
        for (let [x, y] of piece) {
            if (x < this.width && y < this.height) this.grid[y][x] = this.piece.name
        }
        this.hold_used = false
        this.update()

        this.next_piece()
        if (!this.is_free(this.piece.x, this.piece.y)) {
            this.game_over = true
        }
        this.godown()
    }

    swap_hold() {
        if (!this.hold_used) {
            let temp_hold = this.hold
            this.hold = this.piece.name
            if (temp_hold) this.piece = { name: temp_hold, direction: 0, x: 3, y: 18 }
            else this.next_piece()
            this.godown()
            this.hold_used = true
        }
    }
    display() {
        let displayed_grid = this.grid
        let string_grid = displayed_grid.map(row => `|${row.map(letter => letter ? letter : " ").join("")}|`).join("\n")
        return string_grid
    }
    is_free(new_x, new_y, rotation = 0) {
        let test_piece = { name: this.piece.name, direction: (this.piece.direction + rotation) % 4, x: new_x, y: new_y }
        let minos = this.get_minos(test_piece)
        for (let [x, y] of minos) {
            if (y >= this.height || y < 0 || x >= this.width || x < 0 || this.grid[y][x]) {
                return false
            }
        }
        return true
    }
    harddrop() {
        while (this.godown()) { }
        this.lock()
    }
    get_shadow_piece() {
        let y = this.piece.y
        while (this.is_free(this.piece.x, y + 1)) {
            y += 1
        }
        return this.get_minos({ name: this.piece.name, direction: this.piece.direction, x: this.piece.x, y })
    }

    godown() {
        if (this.is_free(this.piece.x, this.piece.y + 1)) {
            this.piece.y ++
            this.score ++
            this.gravity_reset()
            if (!this.is_free(this.piece.x, this.piece.y + 1)) this.gravity_info.last_reset = Date.now()
            else { this.gravity_info.last_reset = undefined }
            this.gravity_info.last_godown = Date.now()
            this.last_movement = "move"
            return true
        }
        if (!this.gravity_info.last_reset) {
            this.gravity_info.last_reset = Date.now()
        }
        return false
    }
    right() {
        if (this.is_free(this.piece.x + 1, this.piece.y)) {
            this.piece.x += 1
            this.gravity_reset()
            this.last_movement = "move"
            return true
        }
        return false
    }
    left() {
        if (this.is_free(this.piece.x - 1, this.piece.y)) {
            this.piece.x -= 1
            this.gravity_reset()
            this.last_movement = "move"
            return true
        }
        return false
    }

    get_minos(piece) {
        let minos = structuredClone(pieces[piece.name][piece.direction])
        for (let mino of minos) {
            mino[0] += piece.x
            mino[1] += piece.y
        }
        return minos
    }

    rotate(angle) {
        let new_direction = (this.piece.direction + angle) % 4
        let kicks = kick_tables[this.piece.name][this.piece.direction][new_direction]
        for (let [x, y] of kicks) {
            let new_x = this.piece.x + x
            let new_y = this.piece.y - y
            if (this.is_free(new_x, new_y, angle)) {
                this.piece.direction = new_direction
                this.piece.x = new_x
                this.piece.y = new_y
                this.gravity_reset()
                this.last_movement = "rotate"
                return
            }
        }
    }

    cw() {
        this.rotate(1)
    }

    ccw() {
        this.rotate(3)
    }
    double_rotate() {
        this.rotate(2)
    }
    update() {
        let lines = 0
        let istspin=this.istspin()
        for (let row = 0; row < this.height; row++) {
            if (!this.grid[row].includes('')) {
                this.cleared_lines++
                lines++
                for (let i = row; i > 0; i--) {
                    this.grid[i] = [...this.grid[i - 1]]
                }
            }
        }
        let is_special = istspin || lines == 4
        this.clear = istspin ? "t" + lines : lines
        if (this.clear != "0"){
        this.score += (this.score_table[this.clear])*(this.b2b && is_special ? 1.5 : 1)
        if (is_special) this.b2b++
        else this.b2b = 0
        }

    }

    istspin() {
        if (this.last_movement == "rotate" && this.piece.name == "t") {
            let corners = 0
            for (let [x, y] of [[0, 1], [0, 3], [2, 1], [2, 3]]) {
                x+=this.piece.x
                y+=this.piece.y
                if (x >= this.width || x < 0 || y >= this.height || y < 0 || this.grid[y][x]!='') {
                    corners++
                }
            }
            if (corners >= 3) return true
        }
        return false
    }
    reset() {
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                this.grid[i][j] = ''
            }
        }
        this.bag = shuffle(["l", "j", "s", "z", "t", "o", "i"])
        this.next_bag = shuffle(["l", "j", "s", "z", "t", "o", "i"])
        this.piece = { name: this.bag.shift(), direction: 0, x: 3, y: 18 }
        this.godown()
        this.hold = undefined
        this.game_over = false
        this.cleared_lines = 0
        this.placed_pieces = 0
        this.gravity_info = {
            last_reset: undefined,
            last_godown: Date.now(),
            resets: 0,
            lowest_row: 0
        }
        this.hold_used = false
        this.score = 0
    }
    gravity_reset() {
        let lowest = Math.max(...this.get_minos(this.piece).map(x => x[1]))
        if (lowest > this.gravity_info.lowest_row) {
            this.gravity_info.lowest_row = lowest
            this.gravity_info.resets = 0
        }
        else if (this.gravity_info.last_reset) this.gravity_info.resets++
        if (this.gravity_info.last_reset) this.gravity_info.last_reset = Date.now()

    }
}

