const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);
context.fillStyle = "#000";
context.fillRect(0, 0, canvas.width, canvas.height);

const colours = [
	null,
	'yellow',
	'red',
	'plum',
	'blue',
	'orange',
	'lawngreen',
	'cyan'
];

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function sweepArena() {
	let rowCount = 1;
	outer: for(let y = arena.length-1; y>0; --y) {
		for(let x = 0; x<arena[y].length; ++x) {
			if(arena[y][x] === 0) {
				continue outer;
			}
		}
		// fill full row with zeros and shift
		const row = arena.splice(y, 1)[0].fill(0);
		arena.unshift(row);
		++y;
		player.score += rowCount * 10;
		rowCount *= 2;
	}
}

// Checks for collision between player and arena/border
function collide(arena, player) {
	const [m, o] = [player.matrix, player.pos]
	for(let y = 0; y < m.length; ++y) {
		for(let x = 0; x < m[y].length; ++x) {
			if(m[y][x] !== 0 && 
			  (arena[y + o.y] && 
			   arena[y + o.y][x + o.x]) !== 0) {
				return true;
			}
		}
	}
	return false;
}

// Creates a matrix of zeros with given height and width
function createMatrix(w, h) {
	const matrix = [];
	while(h--) {
		matrix.push(new Array(w).fill(0));
	}
	return matrix;
}

// Creates a new piece matrix for the player to drop
function createPiece(type) {
	if (type === 'T') {
		return [
			[0, 0, 0],
			[1, 1, 1],
			[0, 1, 0],
		];
	}
	else if (type === 'O') {
		return [
			[2, 2],
			[2, 2],
		];
	}
	else if (type === 'L') {
		return [
			[0, 3, 0],
			[0, 3, 0],
			[0, 3, 3],
		];
	}
	else if (type === 'J') {
		return [
			[0, 4, 0],
			[0, 4, 0],
			[4, 4, 0],
		];
	}
	else if (type === 'I') {
		return [
			[0, 5, 0, 0],
			[0, 5, 0, 0],
			[0, 5, 0, 0],
			[0, 5, 0, 0],
		];
	}
	else if (type === 'S') {
		return [
			[0, 6, 6],
			[6, 6, 0],
			[0, 0, 0],
		];
	}
	else if (type === 'Z') {
		return [
			[7, 7, 0],
			[0, 7, 7],
			[0, 0, 0],
		];
	}
}

//Draw the canvas, including player. Procs every step
function draw() {
	context.fillStyle = "#000";
	context.fillRect(0, 0, canvas.width, canvas.height);
	drawMatrix(arena, {x: 0, y: 0});
	drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset){
	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if(value !== 0) {
				context.fillStyle = colours[value];
				context.fillRect(x + offset.x,
								 y + offset.y,
								 1, 1);
			}
		});
	});
}

function merge(arena, player) {
	player.matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if(value !== 0){
				arena[y + player.pos.y][x + player.pos.x] = value;
			}
		});
	});
}

// Rotate piece using tuple 
function rotate(matrix, direc) {
	for(let y=0; y<matrix.length; y++) {
		for(let x=0; x<y; x++) {
			[ matrix[x][y],
			  matrix[y][x], ] = 
			[ matrix[y][x],
			  matrix[x][y], ];
		}
	}

	if(direc > 0) {
		matrix.forEach(row => row.reverse());
	} else {
		matrix.reverse();
	}
}

// Drop the player's position down one
function dropPlayer() {
	player.pos.y++;
	if (collide(arena, player)) {
		player.pos.y--;
		merge(arena, player);
		playerReset();
		sweepArena();
		updateScore();
	}
	dropCounter = 0;
}

function playerMove(direc) {
	player.pos.x += direc;
	if(collide(arena, player)) {
		player.pos.x -= direc;
	}
}

// Rotate the player piece
function playerRotate(direc) {
	const pos = player.pos.x;
	let offset = 1;
	rotate(player.matrix, direc)
	while(collide(arena, player)) {
		player.pos.x += offset;
		offset = -(offset + (offset > 0 ? 1:-1));

		// If offset to too large, return to original pos
		if(offset > player.matrix[0].length) {
			rotate(player.matrix, -dir);
			player.pos.x = pos;
			return;
		}
	}
}

// Reset player with new piece at top of screen
function playerReset() {
	const pieces = 'TLJOISZ';
	player.matrix = createPiece(
						pieces[pieces.length * Math.random() | 0]);
	player.pos.y = 0;
	player.pos.x = (arena[0].length / 2 | 0) - 
				   (player.matrix[0].length / 2 | 0);
	// If the player piece is blocked to begin with, game over
	if(collide(arena, player)) {
		arena.forEach(row => row.fill(0));
	}
}

// Function to update game to a new frame
function update(time = 0) {
	// A constant delta time value which determines the
	// rate of gameplay
	const deltaTime = time - lastTime;
	lastTime = time;
	//console.log(deltaTime);

	// Drop interval etermines drop rate of a piece
	dropCounter += deltaTime;
	if (dropCounter > dropInterval) {
		dropPlayer();
	}

	// draw new pieces and animate
	draw();
	requestAnimationFrame(update);
}

function updateScore() {
	document.getElementById('score').innerText = player.score;
}

const arena = createMatrix(12, 20);

const player = {
	pos: {x: 5, y: 5},
	matrix: null,
	score: 0,
}

document.addEventListener('keydown', event => {
	//console.log(event);
	if(event.keyCode === 37){
		playerMove(-1);
	}
	else if (event.keyCode === 39){
		playerMove(1);
	}
	else if (event.keyCode === 40){
		dropPlayer();
	}
	else if (event.keyCode === 38 ||
			 event.keyCode === 81) {
		playerRotate(1);
	}
	else if(event.keyCode === 87) {
		playerRotate(-1);
	}
});

playerReset();
updateScore();
update();