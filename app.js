const coasterSearchBox = document.getElementById('coaster-search-box');
const searchList = document.getElementById('search-list');
const resultGrid = document.getElementById('result-grid');

const tileDisplay = document.querySelector('.tile-container')

const popupOpenBtn = document.getElementById('[popup-open-target]');
const popupCloseBtn = document.querySelectorAll('[popupCloseButton]');
const popup = document.getElementById("popup");

const today = Math.floor(Date.now() / 86400000);


let gamemode = 'daily';
var answer;
var answerPark;
var answerCountry;
var currentRow;
let paIDs = [917,2110,2268,3056,3144,2832,2898,2206,716,2270,370,861,2286,2229,2183,1783,2192,2135,2041,2111,2204,3068,178,2354,175,2233,187,2296,59,2137,2058,284,314,387,170,172,202,932,205,222,219,282,176,324,1635,201,289,2202,737,2478,1800,2335,2827,315,2849,2215,2028,270,3066,2946,2323,125];

async function loadCoasters(query) {
    const URL = `https://vast-garden-04559.herokuapp.com/https://captaincoaster.com/api/coasters?page=1&name=${query}`;
    const res = await fetch(`${URL}`, {
			headers: {
				'X-AUTH-TOKEN':'b154f4d4-bbda-404b-ae3e-ea959f68120d'
			}
		})
    const data = await res.json();
    if(data["hydra:totalItems"] > 0) displayCoasterList(data["hydra:member"]);
}

function findCoasters() {
    let query = (coasterSearchBox.value).trim();
    if(query.length > 0) {
        searchList.classList.remove('hide-search-list');
        loadCoasters(query);
    } else {
        searchList.classList.add('hide-search-list');
    }
}

function displayCoasterList(coasters) { 
    searchList.innerHTML = "";
    for(let idx = 0; idx < coasters.length; idx++) {
        let coasterListItem = document.createElement('div');
        coasterListItem.dataset.id = coasters[idx].id;
        coasterListItem.classList.add('search-list-item');
        coasterListItem.innerHTML = `
            <div class = "search-item-info">
                <h3>${coasters[idx].name}</h3>
                <p>${coasters[idx].park.name}</p>
            </div>
        `;
        searchList.appendChild(coasterListItem);
    }
    loadGuess();
}

function loadGuess() {
    const searchListCoasters = searchList.querySelectorAll('.search-list-item');
    searchListCoasters.forEach(coaster => {
        coaster.addEventListener('click', async () => {
            searchList.classList.add(('hide-search-list'));
            coasterSearchBox.value = "";
            const result = await fetch(`https://vast-garden-04559.herokuapp.com/https://captaincoaster.com/api/coasters/${coaster.dataset.id}`, {
                headers: {
                    'X-AUTH-TOKEN':'b154f4d4-bbda-404b-ae3e-ea959f68120d'
                }
            })
            const guess = await result.json();
            console.log(guess);
            if (gamemode == 'daily' && window.localStorage.getItem('gameEnd')) return;
            makeGuess(guess);
        });
    });
}

window.addEventListener('click', (event) => {
    if(event.target.className != "form-control") {
        searchList.classList.add('hide-search-list');
    }
})

// Board
function drawTile(container,row,col,txt="") {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.id = `tile${row}${col}`;
    tile.textContent = txt;

    container.appendChild(tile);
    return tile;
}

function drawGrid(container) {
    const grid = document.createElement('div');
    grid.className = 'grid';
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 9; j++) {
            drawTile(grid, i, j);
        }
    }
    container.appendChild(grid);
}

function updateGrid() {
    for (let i = 0; i < state.grid.length; i++) {
        for (let j = 0; j < state.grid[i].length; j++) {
            const tile = document.getElementById(`tile${i}${j}`);
            tile.textContent = state.grid[i][j];
            if (j == 0) tile.classList.add('nameHolder');
            if (j == 8) {
                tile.classList.add('hintHolder');
                if (i == 2) tile.innerHTML = `<img src="assets/hint1off.png">`;
                if (i == 4) tile.innerHTML = `<img src="assets/hint2off.png">`;
            }
        }
    }
}

function updateTile(i,j) {
    const tile = document.getElementById(`tile${i}${j}`);
    tile.textContent = state.grid[i][j];
}

// Game
const state = {
    grid: Array(6)
        .fill()
        .map(() => Array(9).fill('')),
    currentRow:0,
};

async function startup() {
    if (window.localStorage.getItem(`gamemode`)) gamemode = window.localStorage.getItem(`gamemode`);
    if (gamemode == 'endless') checkMaybeSwitch();

    const game = document.getElementById('game');
    var aID;
    if (gamemode == 'endless') aID = paIDs[Math.floor(Math.random() * paIDs.length)];
    else aID = getDailyCoaster();
    const URL = `https://vast-garden-04559.herokuapp.com/https://captaincoaster.com/api/coasters/${aID}`;
    const res = await fetch(`${URL}`, {
			headers: {
				'X-AUTH-TOKEN':'b154f4d4-bbda-404b-ae3e-ea959f68120d'
			}
		})
    const data = await res.json();
    answer=data;
    const res2 = await fetch(`https://vast-garden-04559.herokuapp.com/https://captaincoaster.com${answer.park["@id"]}`, {
        headers: {
            'X-AUTH-TOKEN':'b154f4d4-bbda-404b-ae3e-ea959f68120d'
        }
    })
    const data2 = await res2.json();
    answerPark=data2;
    answerCountry=answerPark.country.name.substring(8);
    answerCountry = answerCountry[0].toUpperCase() + answerCountry.substring(1);
    drawGrid(game);
    updateGrid();
    if (gamemode == 'daily') updateDaily();
    window.localStorage.setItem(`dayLastPlayed`, today);
    if (window.localStorage.getItem(`daySwap`)) {
        window.localStorage.removeItem('daySwap');
        openPopup("gmReset");
    }
}

startup();

async function makeGuess(guess) {
    const row = state.currentRow;
    if (row > 5) return;
    const res = await fetch(`https://vast-garden-04559.herokuapp.com/https://captaincoaster.com${guess.park["@id"]}`, {
        headers: {
            'X-AUTH-TOKEN':'b154f4d4-bbda-404b-ae3e-ea959f68120d'
        }
    })
    const data = await res.json();
    const guessPark = data;
    let guessCountry = guessPark.country.name.substring(8);
    guessCountry = guessCountry[0].toUpperCase() + guessCountry.substring(1);
    compareStats(guess, guessCountry);
    state.currentRow++;
}

function compareStats(guess, guessCountry) {
    const row = state.currentRow;
    const animation_duration = 700;
    let i = 0;
    // Name
    setTimeout(() => {
        state.grid[row][0] = guess.name + " - " + guess.park.name;
        updateTile(row,0);
    }, ((i++ + 1) * animation_duration) / 2);
    document.getElementById(`tile${row}0`).classList.add('animated')
    document.getElementById(`tile${row}0`).style.animationDelay = `${(0 * animation_duration / 2)}ms`;

    // Manufacturer
    setTimeout(() => {
        state.grid[row][1] = guess.manufacturer.name;
        updateTile(row,1);
        if (answer.manufacturer.name==guess.manufacturer.name) document.getElementById(`tile${row}1`).classList.add('correct');
        else document.getElementById(`tile${row}1`).classList.add('wrong');
    }, ((i++ + 1) * animation_duration) / 2);
    document.getElementById(`tile${row}1`).classList.add('animated')
    document.getElementById(`tile${row}1`).style.animationDelay = `${(1 * animation_duration / 2)}ms`;

    // Height
    setTimeout(() => {
        state.grid[row][2] = "" + guess.height + " m";
        updateTile(row,2);
        if (answer.height==guess.height) document.getElementById(`tile${row}2`).classList.add('correct');
        else if (answer.height > guess.height) document.getElementById(`tile${row}2`).classList.add('higher');
        else document.getElementById(`tile${row}2`).classList.add('lower');
    }, ((i++ + 1) * animation_duration) / 2);
    document.getElementById(`tile${row}2`).classList.add('animated')
    document.getElementById(`tile${row}2`).style.animationDelay = `${(2 * animation_duration / 2)}ms`;

    //Length
    setTimeout(() => {
        state.grid[row][3] = "" + guess.length + " m";
        updateTile(row,3);
        if (answer.length==guess.length) document.getElementById(`tile${row}3`).classList.add('correct');
        else if (answer.length > guess.length) document.getElementById(`tile${row}3`).classList.add('higher');
        else document.getElementById(`tile${row}3`).classList.add('lower');
    }, ((i++ + 1) * animation_duration) / 2);
    document.getElementById(`tile${row}3`).classList.add('animated')
    document.getElementById(`tile${row}3`).style.animationDelay = `${(3 * animation_duration / 2)}ms`;

    //Speed
    setTimeout(() => {
        state.grid[row][4] = "" + guess.speed + " km/h";
        updateTile(row,4);
        if (answer.speed==guess.speed) document.getElementById(`tile${row}4`).classList.add('correct');
        else if (answer.speed > guess.speed) document.getElementById(`tile${row}4`).classList.add('higher');
        else document.getElementById(`tile${row}4`).classList.add('lower');
    }, ((i++ + 1) * animation_duration) / 2);
    document.getElementById(`tile${row}4`).classList.add('animated')
    document.getElementById(`tile${row}4`).style.animationDelay = `${(4 * animation_duration / 2)}ms`;

    //Inversions
    setTimeout(() => {
        state.grid[row][5] = "" + guess.inversionsNumber;
        updateTile(row,5);
        if (answer.inversionsNumber==guess.inversionsNumber) document.getElementById(`tile${row}5`).classList.add('correct');
        else if (answer.inversionsNumber > guess.inversionsNumber) document.getElementById(`tile${row}5`).classList.add('higher');
        else document.getElementById(`tile${row}5`).classList.add('lower');
    }, ((i++ + 1) * animation_duration) / 2);
    document.getElementById(`tile${row}5`).classList.add('animated')
    document.getElementById(`tile${row}5`).style.animationDelay = `${(5 * animation_duration / 2)}ms`;

    //Country
    setTimeout(() => {
        state.grid[row][6] = "" + guessCountry;
        updateTile(row,6);
        if (answerCountry==guessCountry) document.getElementById(`tile${row}6`).classList.add('correct');
        else document.getElementById(`tile${row}6`).classList.add('wrong');
    }, ((i++ + 1) * animation_duration) / 2);
    document.getElementById(`tile${row}6`).classList.add('animated')
    document.getElementById(`tile${row}6`).style.animationDelay = `${(6 * animation_duration / 2)}ms`;

    //Seating Type
    setTimeout(() => {
        state.grid[row][7] = "" + guess.seatingType.name;
        updateTile(row,7);
        if (answer.seatingType.name==guess.seatingType.name) document.getElementById(`tile${row}7`).classList.add('correct');
        else document.getElementById(`tile${row}7`).classList.add('wrong');
    }, ((i++ + 1) * animation_duration) / 2);
    document.getElementById(`tile${row}7`).classList.add('animated')
    document.getElementById(`tile${row}7`).style.animationDelay = `${(7 * animation_duration / 2)}ms`;

    const isWinner = answer.id === guess.id;
    const isGameOver = (row === 5);
    if (gamemode == 'daily' && window.localStorage.getItem('gameEnd')) return;
    if (gamemode == 'daily' && row < 6) window.localStorage.setItem(`guess${(row+1)}`, guess.id);
    setTimeout(() => {
        if(isWinner) {
            //alert(`Congratulations! The answer was ${answer.name}!`);
            // Create confetti animation
            startConfetti();
            addWin(row+1,gamemode);
            document.getElementById('hmsg').innerHTML=(`You got it!`);
            document.getElementById('msg').innerHTML=(`The correct answer was ${answer.name} from ${answerPark.name}.`);
            openPopup("endgame");
            // Remove confetti after animation finishes
            setTimeout(function() {
                stopConfetti();
            }, 3000);
            window.localStorage.setItem('gameEnd','true');
        }
        else if (isGameOver) {
            document.getElementById('hmsg').innerHTML=(`Out of turns :((`);
            document.getElementById('msg').innerHTML=(`The correct answer was ${answer.name} from ${answerPark.name}.`);
            addLoss(gamemode);
            openPopup("endgame");
            window.localStorage.setItem('gameEnd','true');
        }
        else if (row === 2) {
            document.getElementById(`tile28`).innerHTML = `
            <button onclick="openPopup('hint1');">
                <img src="assets/hint1on.png">
            </button>
            `;
            document.getElementById('h1m').innerHTML=(answer.name[0]);
        }
        else if (row === 4) {
            document.getElementById(`tile48`).innerHTML = `
            <button onclick="openPopup('hint2');">
                <img src="assets/hint2on.png">
            </button>
            `;
            let h2temp = answerPark.name.replace(/[^ ]/g,'-');
            h2temp = h2temp.replace(/ /g,'  ');
            document.getElementById('h2m').innerHTML=(answerPark.name[0]+h2temp.substring(1));
        }
    }, 4.5 * animation_duration);
}
function openPopup(name) {
    document.getElementById(name).classList.add('open');
    overlay.classList.add('active');
}

function closePopup(name) {
    document.getElementById(name).classList.remove('open');
    overlay.classList.remove('active');
}


// Daily?
function getDailyCoaster() {
    return paIDs[Math.floor(Date.now() / 86400000)%paIDs.length];
}
function checkMaybeSwitch() {
    const dayLastPlayed = window.localStorage.getItem(`dayLastPlayed`);
    window.localStorage.setItem(`dayLastPlayed`, today)
    console.log(today);
    if (dayLastPlayed != today) {
        for (let i = 1; i < 7; i++) {
            window.localStorage.removeItem(`guess${i}`,);
        }
        window.localStorage.removeItem(`gameEnd`);
        window.localStorage.setItem(`daySwap`,'true');
        switchGamemode();
    }
}
async function updateDaily() {
    const dayLastPlayed = window.localStorage.getItem(`dayLastPlayed`);
    window.localStorage.setItem(`dayLastPlayed`, today)
    if (dayLastPlayed != today) {
        for (let i = 1; i < 7; i++) {
            window.localStorage.removeItem(`guess${i}`,);
        }
        window.localStorage.removeItem(`gameEnd`);
    }
    else {
        const timer = ms => new Promise(res => setTimeout(res, ms));
        for (let i = 1; i < 7; i++) {
            const currGuess = window.localStorage.getItem(`guess${i}`);
            if (currGuess) {
                let guessID = parseInt(currGuess);
                const result = await fetch(`https://vast-garden-04559.herokuapp.com/https://captaincoaster.com/api/coasters/${guessID}`, {
                    headers: {
                        'X-AUTH-TOKEN':'b154f4d4-bbda-404b-ae3e-ea959f68120d'
                    }
                })
                const guess = await result.json();
                console.log(guess);
                makeGuess(guess);
                await timer(50);
            }
            else break;
        }
    }
}
// Local Storage Stats Page (yippe)
const canvasElementDaily = document.getElementById("dailyStatChart");
const canvasElementEndless = document.getElementById("endlessStatChart");

const configDaily = {
    type: "bar",
    data: {
        labels: ["1","2","3","4","5","6"],
        datasets: [{
            label: "Games Won",
            data: loadStats('daily'),
            backgroundColor: [
                "rgba(255, 99, 132, 0.3)",
                "rgba(255, 159, 64, 0.3)",
                "rgba(240, 230, 140, 0.5)",
                "rgba(75, 192, 192, 0.3)",
                "rgba(54, 162, 235, 0.3)",
                "rgba(153, 102, 255, 0.3)"
            ],
            borderColor: [
                "rgba(255, 99, 132 , 1)",
                "rgba(255, 159, 64, 1)",
                "rgba(240, 230, 100, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(153, 102, 255, 1)"
            ],
            borderWidth: 1,
        }],
    },
    options: {
        indexAxis: 'y',
        scales: {
            x: {
                suggestedMax: 5,
                title: {
                    display: true,
                    text: 'Games'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Turns'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
    
};

const configEndless = {
    type: "bar",
    data: {
        labels: ["1","2","3","4","5","6"],
        datasets: [{
            label: "Games Won",
            data: loadStats('endless'),
            backgroundColor: [
                "rgba(255, 99, 132, 0.3)",
                "rgba(255, 159, 64, 0.3)",
                "rgba(240, 230, 140, 0.5)",
                "rgba(75, 192, 192, 0.3)",
                "rgba(54, 162, 235, 0.3)",
                "rgba(153, 102, 255, 0.3)"
            ],
            borderColor: [
                "rgba(255, 99, 132 , 1)",
                "rgba(255, 159, 64, 1)",
                "rgba(240, 230, 100, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(153, 102, 255, 1)"
            ],
            borderWidth: 1,
        }],
    },
    options: {
        indexAxis: 'y',
        scales: {
            x: {
                suggestedMax: 5,
                title: {
                    display: true,
                    text: 'Games'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Turns'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    }
    
};


var dailyStatChart = new Chart(canvasElementDaily, configDaily); 
var endlessStatChart = new Chart(canvasElementEndless, configEndless);

function addWin(turn,gamemode) {
    const wins = window.localStorage.getItem(`wins${gamemode}`);
    if (!wins) window.localStorage.setItem(`wins${gamemode}`, 1);
    else localStorage.setItem(`wins${gamemode}`,parseInt(localStorage.getItem(`wins${gamemode}`))+1);
    const rowScore = window.localStorage.getItem(`row${turn}score${gamemode}`);
    if (!rowScore) window.localStorage.setItem(`row${turn}score${gamemode}`, 1);
    else localStorage.setItem(`row${turn}score${gamemode}`,parseInt(localStorage.getItem(`row${turn}score${gamemode}`))+1);
    if (gamemode == 'daily')  {
        dailyStatChart.config.data = {
            labels: ["1","2","3","4","5","6"],
            datasets: [{
                label: "Games Won",
                data: loadStats(gamemode),
                backgroundColor: [
                    "rgba(255, 99, 132, 0.3)",
                    "rgba(255, 159, 64, 0.3)",
                    "rgba(240, 230, 140, 0.5)",
                    "rgba(75, 192, 192, 0.3)",
                    "rgba(54, 162, 235, 0.3)",
                    "rgba(153, 102, 255, 0.3)"
                ],
                borderColor: [
                    "rgba(255, 99, 132 , 1)",
                    "rgba(255, 159, 64, 1)",
                    "rgba(240, 230, 100, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(153, 102, 255, 1)"
                ],
                borderWidth: 1,
            }],
        };
        dailyStatChart.update();
    }
    else {
        endlessStatChart.config.data = {
            labels: ["1","2","3","4","5","6"],
            datasets: [{
                label: "Games Won",
                data: loadStats(gamemode),
                backgroundColor: [
                    "rgba(255, 99, 132, 0.3)",
                    "rgba(255, 159, 64, 0.3)",
                    "rgba(240, 230, 140, 0.5)",
                    "rgba(75, 192, 192, 0.3)",
                    "rgba(54, 162, 235, 0.3)",
                    "rgba(153, 102, 255, 0.3)"
                ],
                borderColor: [
                    "rgba(255, 99, 132 , 1)",
                    "rgba(255, 159, 64, 1)",
                    "rgba(240, 230, 100, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(153, 102, 255, 1)"
                ],
                borderWidth: 1,
            }],
        };
        endlessStatChart.update();
    }
}
function addLoss(gamemode) {
    const losses = window.localStorage.getItem(`losses${gamemode}`);
    if (!losses) window.localStorage.setItem(`losses${gamemode}`, 1);
    else localStorage.setItem(`losses${gamemode}`,parseInt(localStorage.getItem(`losses${gamemode}`))+1);
}
function loadStats(gamemode) {
    const scores = []
    for (let i = 1; i < 7; i++) {
        const rowScore = window.localStorage.getItem(`row${i}score${gamemode}`);
        if (!rowScore) scores.push(0);
        else scores.push(parseInt(localStorage.getItem(`row${i}score${gamemode}`)));
    }
    return scores;
}

if (gamemode == 'endless') {
    document.getElementById("gmButton").src="assets/endless.png";
}

function switchGamemode() {
    if (gamemode == 'daily') {
        window.localStorage.setItem('gamemode','endless');
    }
    else {
        window.localStorage.setItem('gamemode','daily');
    }
    location.reload();
}