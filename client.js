
init();

function initBoard(n) {
	board = new Object();
	board.n = n;
	board.spaces = new Array(n*n);
	for (var i = 0; i < n*n; i++) {
		board.spaces[i] = new Array(n*n);
	}

	return board;
}

function init(){
	board = fillBoard("1xxxx2xxxx3xxxx4");
	printBoard(board);
}

function fillBoard(str){
	//if the input length is not a perfect fourth, reject it
	n = Math.pow(str.length, 1/4);
	if(str.length <= 0 || n % 1 !== 0){
		console.log("board input not correct length. Please use 16, 81, 256 etc.")
		return;
	}

	board = initBoard(n);

	//input values into board
	var k=0;
	var column;
	for (var i = 0; i < board.spaces.length; i++) {
		column = [];
		for(var j = 0; j < board.spaces.length; j++){
			if(str.charAt(k) == '0' || str.charAt(k) == 'x' || str.charAt(k) == 'X'){
				column.push('.');
				k++;
			} else {
				column.push(str.charAt(k++));
			}
		}
		board.spaces[i] = column;
	}

	return board;
}

function printBoard(board){
	console.log("printing board")
	var str;
	for (var i = 0; i < board.spaces.length; i++) {
		str = "";
		for(var j = 0; j < board.spaces.length; j++){
			str = str.concat(board.spaces[i][j]);
		}
		console.log(str);
	}
	console.log("done printing");
}