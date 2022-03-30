let clear_names = {
    "1":["Single","white"],
    "2":["Double","white"],
    "3":["Triple","white"],
    "4":["Sartris","cyan"],
    "t0":["T-Spin","rgb(189, 0, 189)"],
    "t1":["T-Spin Single","rgb(189, 0, 189)"],
    "t2":["T-Spin Double","rgb(189, 0, 189)"],
    "t3":["T-Spin Triple","rgb(189, 0, 189)"]
}

function ultra(){
    win_condition=ultra_win_condition
    reset()
}

function sprint(){
    win_condition=sprint_win_condition
    reset()
}

let height_factor = window.innerHeight / 880 * 0.9

function sg(){clearTimeout(gravity_timeout)}

function setCookie(key, value) {
    document.cookie = `${key}=${value};max-age=157680000`
}

function getCookie(key) {
    let regexp = new RegExp(`(^|; )${key}=(.*?)(;|$)`)
    let matches = regexp.exec(document.cookie)
    if (matches) return matches[2]
    else return undefined

}

function deleteCookie(name)
{
    document.cookie = `${name}= ;max-age=0`
}

if (getCookie("highScore") && !getCookie("highScore").match(/^\d+$/)) deleteCookie("highScore")

let preloaded_images = []
for (let folder of ["shadows", "pieces", "image_pieces"]) {
    for (let piece of "toiljsz") {
        let image = (new Image())
        image.src = `./${folder}/${piece}.png`
        preloaded_images.push(image)
    }
}
function preload(array){
    for (let image_name of array)
    {
        let image=new Image()
        image.src=image_name
        preloaded_images.push(image)
    }
}
preload(["./0.png","./1.png","./2.png","./3.png","Grille Contour.png"])


function minos_grid(container, height, width) {
    let minos_list = []
    for (let y = 0; y < height; y++) {
        let row = []
        for (let x = 0; x < width; x++) {
            row.push(document.createElement("img"))
            row[x].className = "mino"
            row[x].style.gridColumn = `${x + 1}/${x + 1}`
            row[x].style.gridRow = `${y + 1}/${y + 1}`
            row[x].src = "./pieces/void.png"
            row[x].style.height = 40 * height_factor + "px"
            container.appendChild(row[x])
        }
        minos_list.push(row)
    }
    return minos_list

}

// update functions
function update_screen(grid) {
    refresh_tracker()
    let shift = grid.height - grid.visible_height
    let visible_grid = grid.grid.slice(shift,).map(row => row.map(name => name ? name : "void"))
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
            grid_minos_list[y][x].src = `./pieces/${visible_grid[y][x]}.png`
        }
    }
}
function duet_in_array(search_array, duet) {
    for (let [x, y] of search_array) {
        if (x == duet[0] && y == duet[1]) return true
    }
    return false
}
function refresh_tracker() {
    minos_tracker.piece = grid.get_minos(grid.piece)
    minos_tracker.shadow = grid.get_shadow_piece()
}
function update_piece(grid) {
    let shift = grid.height - grid.visible_height
    for (let [x, y] of minos_tracker.shadow) {
        if (y - shift >= 0) grid_minos_list[y - shift][x].src = `./pieces/void.png`
    }
    minos_tracker.shadow = grid.get_shadow_piece()
    for (let [x, y] of minos_tracker.shadow) {
        if (y - shift >= 0) {
            grid_minos_list[y - shift][x].src = `./shadows/${grid.piece.name}.png`
        }
    }
    for (let [x, y] of minos_tracker.piece) {
        if (!duet_in_array(minos_tracker.shadow, [x, y]) && y - shift >= 0) grid_minos_list[y - shift][x].src = `./pieces/void.png`
    }
    minos_tracker.piece = grid.get_minos(grid.piece)
    for (let [x, y] of minos_tracker.piece) {
        if (y - shift >= 0) grid_minos_list[y - shift][x].src = `./pieces/${grid.piece.name}.png`
    }

}
function update_queue(grid) {
    let queue = grid.bag.concat(grid.next_bag)
    for (let i = 0; i < 5; i++) {
        visual_queue[i].src = `./image_pieces/${queue[i]}.png`
    }
}
function update_hold(grid) {
    if (grid.hold) visual_hold.src = `./image_pieces/${grid.hold}.png`
    else visual_hold.src = `./image_pieces/void.png`
}

function place_piece() {
    grid.harddrop()
    if (grid.clear!="0")
    {
        clearTimeout(clear_timeout)
        clear_node.textContent=clear_names[grid.clear][0]
        clear_node.style.color=clear_names[grid.clear][1]
        if (grid.b2b>1) btb_node.style.display=''
        clear_timeout=setTimeout(()=>{
            clear_node.textContent=""
            btb_node.style.display='none'

        },1500)
    }
    refresh_score()
    if (grid.game_over) {
        reset()
    }
    piece_spawn()
    if (win_condition.test()) {
        clearTimeout(gravity_timeout)
        win_screen(win_condition.score())
    }
}

let right_mvt = false
let left_mvt = false
let down_mvt = false
function addCommands(controls) {
    addCommand(controls.hd, () => {
        place_piece()

    })
    addCommand(controls.sd, () => {
        if (!down_mvt) {
            down_mvt = true
            let down_timer = Date.now()
            let delay = controls.sd_arr
            function down() {
                if (down_mvt) {
                    let new_time = Date.now()
                    let moved = true
                    while (moved && new_time > down_timer + delay) {
                        down_timer += delay
                        moved = grid.godown()
                        update_piece(grid)
                    }
                    requestAnimationFrame(down)
                }
            }
            down()
        }
    })
    addCommand(controls.right, () => {
        if (!right_mvt) {
            left_mvt = false
            right_mvt = true
            let right_timer = Date.now()
            grid.right()
            update_piece(grid)
            let delay = controls.das
            function right() {
                if (right_mvt) {
                    let new_time = Date.now()
                    let moved = true
                    while (moved && new_time > right_timer + delay) {
                        right_timer += delay
                        delay = controls.arr
                        moved = grid.right()
                        update_piece(grid)
                    }
                    requestAnimationFrame(right)
                }
            }
            right()
        }
    })
    addCommand(controls.left, () => {
        if (!left_mvt) {
            right_mvt = false
            left_mvt = true
            let left_timer = Date.now()
            grid.left()
            update_piece(grid)
            let delay = controls.das
            function left() {
                if (left_mvt) {
                    let new_time = Date.now()
                    let moved = true
                    while (moved && new_time > left_timer + delay) {
                        left_timer += delay
                        delay = controls.arr
                        moved = grid.left()
                        update_piece(grid)
                    }
                    requestAnimationFrame(left)
                }
            }
            left()
        }
    })
    addCommand(controls.hold, () => {
        grid.swap_hold()
        piece_spawn()
    })
    addCommand(controls.cw, () => {
        grid.cw()
        update_piece(grid)
    })
    addCommand(controls.double_rotate, () => {
        grid.double_rotate()
        update_piece(grid)
    })
    addCommand(controls.ccw, () => {
        grid.ccw()
        update_piece(grid)
    })

    addCommand(controls.reset, reset)

    document.addEventListener("keyup", event => {
        if (event.code == controls.right) {
            right_mvt = false
        }
    })

    document.addEventListener("keyup", event => {
        if (event.code == controls.left) {
            left_mvt = false
        }
    })
    document.addEventListener("keyup", event => {
        if (event.code == controls.sd) {
            down_mvt = false
        }
    })
}
function addCommand(key, fct) {
    document.addEventListener("keydown", event => { 
        if (event.code == key) fct() })
}
if (getCookie("controls") && JSON.parse(getCookie("controls")).version==2) {
    controls = JSON.parse(getCookie("controls"))
}
else controls = {
    "version": 2,
    "hd": "Space",
    "sd": "ArrowDown",
    "right": "ArrowRight",
    "left": "ArrowLeft",
    "ccw": "KeyW",
    "cw": "ArrowUp",
    "double_rotate": "KeyQ",
    "hold": "KeyC",
    "reset": "F4",
    "arr": 16,
    "das": 133,
    "sd_arr": 16,
    "opacity": 0.8
}
let _listeners = [];
EventTarget.prototype.addEventListenerBase = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type, listener) {
    _listeners.push({ target: this, type: type, listener: listener });
    this.addEventListenerBase(type, listener);
}
EventTarget.prototype.removeEventListeners = function () {
    for (let index = 0; index != _listeners.length; index++) {
        let item = _listeners[index];

        let target = item.target;
        let type = item.type;
        let listener = item.listener;

        if (target == this) {
            this.removeEventListener(type, listener);
        }
    }
}

let controls_select_box = document.querySelector("#controls")
let controls_select_grid = document.querySelector("#controls_grid")
function key_selector(control, name, controls) {
    let input = document.createElement("input")
    let text = document.createTextNode(name + ":")
    input.value = controls[control]
    input.className="key_input"
    input.addEventListener("keydown", event => {
        event.stopPropagation()
        event.preventDefault()
        controls[control] = event.code
        if (input.value != event.code) {
            input.value = event.code
        }
    })
    input.addEventListener("keyup",()=>{
        input.nextElementSibling.focus()})
    return [text, input]
}
function number_selector(control, name, controls) {
    let input = document.createElement("input")
    let text = document.createTextNode(name + ":")
    input.value = controls[control]
    input.addEventListener("keyup", event => {
        event.stopPropagation()
        if (/^\d+$/.test(input.value)) {
            controls[control] = Number(input.value)
            input.style.background = "white"
        }
        else {
            input.style.background = "red"
        }

    })
    return [text, input]
}

function opacity_selector(controls) {
    let input = document.createElement("input")
    input.type = "range"
    let text = document.createTextNode("Opacité:")
    input.min=0
    input.max=1
    input.step=0.05
    input.value = controls.opacity
    input.addEventListener("click", event => {
        controls.opacity=input.value
        visual_grid.style.background=`rgba(50,50,50,${controls.opacity})` 
    })
    return [text, input]
}

function appendChildren(container, array) {
    for (let node of array) {
        container.appendChild(node)
    }
}

document.querySelector("#control_button").addEventListener("click", () => controls_select_box.showModal())
{
    appendChildren(controls_select_grid, key_selector("hd", "Chute Instantanée", controls))
    appendChildren(controls_select_grid, key_selector("sd", "Chute rapide", controls))
    appendChildren(controls_select_grid, key_selector("left", "Gauche", controls))
    appendChildren(controls_select_grid, key_selector("right", "Droite", controls))
    appendChildren(controls_select_grid, key_selector("cw", "Rotation horaire", controls))
    appendChildren(controls_select_grid, key_selector("ccw", "Rotation antihoraire", controls))
    appendChildren(controls_select_grid, key_selector("double_rotate", "Rotation 180°", controls))
    appendChildren(controls_select_grid, key_selector("hold", "Stocakge", controls))
    appendChildren(controls_select_grid, key_selector("reset", "Recommencer", controls))
    appendChildren(controls_select_grid, number_selector("das", "DAS", controls))
    appendChildren(controls_select_grid, number_selector("arr", "ARR", controls))
    appendChildren(controls_select_grid, number_selector("sd_arr", "Délai de chute rapide", controls))
    appendChildren(controls_select_grid, opacity_selector(controls))
    addCommands(controls)
}

document.querySelector('#sprint').addEventListener("click", sprint)
document.querySelector('#ultra').addEventListener("click", ultra)

function end_select_controls() {
    controls_select_box.close()
    document.removeEventListeners()
    addCommands(controls)
    setCookie("controls", JSON.stringify(controls))
}

function start_animation() {
    let box = document.createElement("dialog")
    document.body.append(box)
    box.id = "counter_box"
    let game_info = document.createElement("p")
    game_info.style.color = "white"
    game_info.style.fontSize = "40px"
    game_info.style.fontFamily = "pixelFont"
    game_info.textAlign = "center"
    game_info.textContent = win_condition.mission
    let image = document.createElement("img")
    image.src = "./3.png"
    image.style.marginLeft = "auto"
    image.style.marginRight = "auto"
    image.style.display = "block"
    box.appendChild(game_info)
    box.appendChild(image)
    box.showModal()
    let startTime = Date.now()
    let currentTime = Date.now()
    let value = 3
    function _animation() {
        if (currentTime - startTime < 2000) {
            value = String(3 - Math.floor((currentTime - startTime) / 500))
            image.src = `./${value}.png`
            currentTime = Date.now()
            requestAnimationFrame(_animation)
        }
        else {
            box.close()
            delete box
            game_start()
        }
    }
    _animation()
}


function win_screen(score) {
    start_time = undefined
    let win_box = document.createElement("dialog")
    let pb_label = document.createElement("pre")
    win_box.appendChild(pb_label)
    if (getCookie(win_condition.cookie)) {
        let oldScore = getCookie(win_condition.cookie)
        if (win_condition.is_better(score, oldScore)) {
            setCookie(win_condition.cookie, score)
            pb_label.textContent = "Nouveau record !\nVotre ancien record était " + win_condition.format_score(oldScore)
        }
        else {
            pb_label.textContent = "Votre record est " + win_condition.format_score(oldScore)
        }
    }
    else {
        setCookie(win_condition.cookie, score)
        pb_label.textContent = "C'était votre première partie!"
    }
    document.removeEventListeners()
    let score_node = document.createElement("pre")
    win_box.appendChild(score_node)
    score_node.textContent = `${win_condition.score_label}: ${win_condition.format_score(score)}\n${pps} PPS\n${grid.placed_pieces} pièces`
    let close_button = document.createElement("button")
    close_button.textContent = "Retour"
    close_button.onclick = function () {
        win_box.close()
        reset()
    }
    close_button.test
    win_box.appendChild(close_button)
    document.body.appendChild(win_box)
    win_box.showModal()

}
function reset() {
    clearTimeout(gravity_timeout)
    pb = getCookie(win_condition.cookie)
    if (pb) pb_node.textContent = `Meilleur ${win_condition.score_label}\n` + win_condition.format_score(pb)
    grid.reset()
    start_time = undefined
    piece_spawn()
    document.removeEventListeners()
    start_animation()

}
function game_start() {
    pps=0
    clearTimeout(gravity_timeout)
    addCommands(controls)
    start_time = Date.now()
    refresh_score()
    refresh_gravity()
}

function piece_spawn() {
    update_hold(grid)
    update_queue(grid)
    update_screen(grid)
    update_piece(grid)
}
let clear_timeout

let lock_delay = 500
let gravity_delay = 1000
let gravity_timeout
let pps=0

let game_container = document.querySelector("#game_container")
game_container.style.left = (window.innerWidth - 910 * height_factor) / 2 + "px"
game_container.style.top = 0.05 * window.innerHeight + "px"
let interface = document.querySelector("#interface")
interface.height = 880 * height_factor

let visual_grid = document.querySelector("#grid")
visual_grid.style.background=`rgba(50,50,50,${controls.opacity})` 
visual_grid.style.left = 255 * height_factor + "px"
visual_grid.style.top = 40 * height_factor + "px"
let grid_minos_list = minos_grid(visual_grid, 20, 10)
let queue_container = document.querySelector("#queue")
queue_container.style.left = 712 * height_factor + "px"
queue_container.style.top = 70 * height_factor + "px"
let visual_queue = queue_container.children
for (let piece of visual_queue) {
    piece.style.height = 80 * height_factor + "px"
    piece.style.marginTop = 10 * height_factor + "px"
    piece.style.marginBottom = 10 * height_factor + "px"
}
let visual_hold = document.querySelector("#hold")
visual_hold.style.height = 80 * height_factor + "px"
visual_hold.style.left = 34 * height_factor + "px"
visual_hold.style.top = 77 * height_factor + "px"


let sprint_win_condition = {
    test: () => grid.cleared_lines >= 40,
    score: () => Date.now() - start_time,
    cookie: "highScore",
    score_label:"temps",
    is_better: (score1, score2)=> score1<score2,
    format_score: (score)=>displayable_time(score, 2),
    mission: "Supprimez 40 lignes aussi vite que possible!",
    lines_label: "/40"
}
let ultra_win_condition = {
    test: () => Date.now() - start_time >= 120000,
    score: () => grid.score,
    cookie: "ultraHighScore",
    score_label:"score",
    is_better: (score1, score2)=> score1>score2,
    format_score: score=>score,
    mission: "Faites le meilleur score possible en 2 minutes!",
    lines_label: ""
}

let win_condition=ultra_win_condition

let start_time
let pb = getCookie(win_condition.cookie)
let grid = new SartrisGrid()
let minos_tracker = {
    piece: grid.get_minos(grid.piece),
    shadow: grid.get_shadow_piece()
}

let timer_node = document.querySelector("#timer")
timer_node.style.fontSize = 40 * height_factor + "px"
timer_node.parentNode.style.left = 35 * height_factor + "px"
timer_node.parentNode.style.top = 230 * height_factor + "px"
let score_node = document.querySelector("#score")
score_node.style.fontSize = 40 * height_factor + "px"
score_node.parentNode.style.left = 712 * height_factor + "px"
score_node.parentNode.style.top = 670 * height_factor + "px"
let lines_node = document.querySelector("#lines")
lines_node.style.fontSize = 40 * height_factor + "px"
lines_node.parentNode.style.left = 22 * height_factor + "px"
lines_node.parentNode.style.top = 390 * height_factor + "px"
let pps_node = document.querySelector("#pps")
pps_node.style.fontSize = 40 * height_factor + "px"
pps_node.parentNode.style.left = 22 * height_factor + "px"
pps_node.parentNode.style.top = 500 * height_factor + "px"
let pieces_node = document.querySelector("#pieces")
pieces_node.style.fontSize = 40 * height_factor + "px"
pieces_node.parentNode.style.left = 22 * height_factor + "px"
pieces_node.parentNode.style.top = 600 * height_factor + "px"
let pb_node = document.querySelector("#pb")
pb_node.style.fontSize = 25 * height_factor + "px"
pb_node.parentNode.style.left = 22 * height_factor + "px"
pb_node.parentNode.style.top = 725 * height_factor + "px"
let clear_node = document.querySelector("#line_clear")
clear_node.style.fontSize = 40 * height_factor + "px"
clear_node.parentNode.style.left = -220 * height_factor + "px"
clear_node.parentNode.style.width = 200 * height_factor + "px"
clear_node.parentNode.style.top = 230 * height_factor + "px"
let btb_node = document.querySelector("#b2b")
btb_node.style.fontSize = 20 * height_factor + "px"
btb_node.parentNode.style.left = -220 * height_factor + "px"
btb_node.parentNode.style.width = 200 * height_factor + "px"
btb_node.parentNode.style.top = 205 * height_factor + "px"

reset()

function displayable_time(time,digits=1) {
    minutes = Math.floor(time / (60000))
    time -= 60000 * minutes
    seconds = Math.floor(time / 1000)
    time -= 1000 * seconds
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(time).slice(0,digits)}`
}

function refresh_score(){
    score_node.textContent=grid.score
}

function refresh_stats() {
    let time = Date.now() - start_time
    timer_node.textContent = start_time ? displayable_time(time) : "00:00.0"
    lines_node.textContent = "Lignes\n" + grid.cleared_lines + win_condition.lines_label
    pps=time ? String(grid.placed_pieces / time * 1000).slice(0, 3) : "0.0"
    pps_node.textContent = "PPS\n" + (pps)
    pieces_node.textContent = "Pièces\n" + grid.placed_pieces
    setTimeout(refresh_stats, 100)
}
refresh_stats()


function refresh_gravity() {
    let new_date = Date.now()
    if (new_date - grid.gravity_info.last_godown > gravity_delay) { grid.godown() }
    if (grid.is_free(grid.piece.x, grid.piece.y + 1)) grid.gravity_info.last_reset=undefined
    if (grid.gravity_info.last_reset && new_date - grid.gravity_info.last_reset > lock_delay) place_piece()
    if (grid.gravity_info.resets > 14) place_piece()
    update_piece(grid)
    gravity_timeout = setTimeout(refresh_gravity, 50)
}

