var numSelected = null;
var tileSelected = null;
var errors = 0;
var currentBoard = [];
var currentSolution = [];
var currentDifficulty = 'medium';
var isGameOver = false;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function isValid(board, row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) {
            return false;
        }
    }
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) {
            return false;
        }
    }
    let startRow = row - (row % 3);
    let startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) {
                return false;
            }
        }
    }
    return true;
}

function fillBoard(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                let numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

                for (let num of numbers) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (fillBoard(board)) {
                            return true;
                        } else {
                            board[row][col] = 0;
                        }
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function createPuzzle(solvedBoard, difficulty) {
    let puzzleBoard = solvedBoard.map(row => [...row]);

    let cellsToRemove;
    switch (difficulty) {
        case 'easy':
            cellsToRemove = 40;
            break;
        case 'medium':
            cellsToRemove = 50;
            break;
        case 'hard':
            cellsToRemove = 60;
            break;
        default:
            cellsToRemove = 50;
    }

    let removedCount = 0;
    while (removedCount < cellsToRemove) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);

        if (puzzleBoard[row][col] !== 0) {
            puzzleBoard[row][col] = 0;
            removedCount++;
        }
    }
    return puzzleBoard.map(row => row.map(cell => cell === 0 ? '-' : cell.toString()));
}

function generateSudokuPuzzle(difficulty) {
    let board = Array(9).fill(0).map(() => Array(9).fill(0));
    fillBoard(board);
    let solvedBoard = board.map(row => row.map(cell => cell.toString()));
    let puzzleBoard = createPuzzle(board, difficulty);
    return { board: puzzleBoard, solution: solvedBoard };
}

$(document).ready(function() {
    $('.difficulty-button[data-difficulty="' + currentDifficulty + '"]').addClass('selected-difficulty');
    startNewGame(currentDifficulty);
});

function startNewGame(difficulty) {
    errors = 0;
    $("#errors").text("Errors: 0");
    numSelected = null;
    tileSelected = null;
    isGameOver = false;
    
    $('#game-over-modal').removeClass('active');
    $('#game-container').removeClass('pointer-events-none opacity-50 blur-sm');
    $('html, body').removeClass('no-scroll');

    const { board, solution } = generateSudokuPuzzle(difficulty);
    currentBoard = board;
    currentSolution = solution;

    setGame();
}

function setGame() {
    $("#digits").empty();
    $("#board").empty();

    for (let i = 1; i <= 9; i++) {
        let number = $('<div></div>')
            .attr('id', i)
            .text(i)
            .on("click", selectNumber)
            .addClass("number");
        $("#digits").append(number);
    }

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let tile = $('<div></div>');
            tile.attr('id', r.toString() + "-" + c.toString());

            if (currentBoard[r][c] !== "-") {
                tile.text(currentBoard[r][c]);
                tile.addClass("tile-start");
            }
            tile.on("click", selectTile);
            tile.addClass("tile");
            $("#board").append(tile);
        }
    }
}

function selectNumber() {
    if (numSelected != null) {
        $(numSelected).removeClass("number-selected");
    }
    numSelected = this;
    $(numSelected).addClass("number-selected");
}

function selectTile() {
    if (numSelected && !isGameOver) {
        if ($(this).hasClass("tile-start")) {
            return;
        }
        
        if (tileSelected != null) {
            $(tileSelected).removeClass("bg-blue-200"); // Removed Tailwind class, will now rely on custom .tile-selected-highlight if added
        }
        tileSelected = this;
        // Adding a new class for highlighting the selected tile
        $(tileSelected).addClass("tile-selected-highlight");

        let coords = $(this).attr('id').split("-");
        let r = parseInt(coords[0]);
        let c = parseInt(coords[1]);

        if (currentSolution[r][c] === $(numSelected).attr('id')) {
            $(this).text($(numSelected).attr('id'));
            $(tileSelected).removeClass("tile-selected-highlight"); // Remove highlight on correct placement
            tileSelected = null;
        }
        else {
            errors += 1;
            $("#errors").text("Errors: " + errors);
            // Adding a new class for incorrect guess highlight
            $(this).addClass("tile-incorrect-highlight").delay(300).queue(function(next) {
                $(this).removeClass("tile-incorrect-highlight");
                next();
            });

            if (errors > 15) {
                displayGameOver();
            }
        }
    }
}

function displayGameOver() {
    isGameOver = true;
    $('.game-over-modal').addClass('active'); // Use the new class
    $('.game-container').addClass('pointer-events-none opacity-50 blur-sm'); // These utility classes are kept as they define behavior, but their CSS is in styles.css
    $('html, body').addClass('no-scroll');
}

$('#clear-board-button').on('click', function() {
    if (!isGameOver) {
        errors = 0;
        $("#errors").text("Errors: 0");

        $('#board .tile').each(function() {
            if (!$(this).hasClass('tile-start')) {
                $(this).text('');
                $(this).removeClass('tile-incorrect-highlight tile-selected-highlight'); // Updated class names
            }
        });
        numSelected = null;
        tileSelected = null;
        $('.number-selected').removeClass('number-selected');
    }
});

$('#new-game-button').on('click', function() {
    startNewGame(currentDifficulty);
});

$('#difficulty-selector button').on('click', function() {
    $('.difficulty-button').removeClass('selected-difficulty');
    $(this).addClass('selected-difficulty');
    
    currentDifficulty = $(this).data('difficulty');
    startNewGame(currentDifficulty);
});

$('#play-again-button').on('click', function() {
    startNewGame(currentDifficulty);
});