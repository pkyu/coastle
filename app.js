const coasterSearchBox = document.getElementById('coaster-search-box');
const searchList = document.getElementById('search-list');
const resultGrid = document.getElementById('result-grid');

const tileDisplay = document.querySelector('.tile-container')

const popupOpenBtn = document.getElementById('[popup-open-target]');
const popupCloseBtn = document.querySelectorAll('[popupCloseButton]');
const popup = document.getElementById("popup");

const today = Math.floor(Date.now() / 86400000);
let gamemode = 'daily';
let endlessHardMode = false;
let usingMetric = false;
var answer;
var answerPark;
var answerCountry;
var currentRow;
var CC_API_KEY = tk();

let paIDs = [2268,517,5356,2270,2215,2827,917,62,284,4020,2058,2204,2202,3144,404,2183,2043,3759,861,2110,1635,1880,258,494,2135,186,187,3286,1145,2206,3066,170,932,2028,2190,2269,125,935,2261,468,387,2354,1773,2946,202,917,2335,176,2329,324,2192,3308,2110,2286,5387,344,5521,59,2898,5612,128,3067,1979,175,270,2819,5767,924,370,1032,2055,2832,3687,2896,2136,282,172,2296,1476,737,2186,3048,2323,302,2137,21,2461,3068,315,2041,2849,2229,1783,2233,3056,326,289,178,2798,2111,2343,2054,1628,2292,2164,314,799,3044];
let extended_paIDs = [3067,2006,1979,5387,5612,5521,2211,201,2210,2245,2209,979,2247,2461,2469,1619,1259,235,1625,1174,84,1802,34,1252,2364,1314,732,2205,3880,2095,2113,2213,304,749,2183,1622,559,1272,2833,2201,495,2377,3154,595,2821,2106,189,1396,403,560,2055,147,801,2115,2809,656,920,637,1036,388,389,1207,534,977,3047,195,138,1410,2598,442,1626,1898,1820,1979,710,270,181,1989,2185,2000,1980,2179,129,41,1785,131,517,3055,1648,753,19,706,2072,2374,1141,2109,300,686,1909,263,717,919,448,245,2350,492,842,281,1908,1910,234,1457,429,917,2110,2268,404,2832,2206,716,2270,370,861,2286,2229,2261,2183,3286,1783,2192,2135,258,2041,2111,2204,3068,178,2354,175,2233,187,2296,2137,2058,284,314,2898,3144,170,59,2136,387,932,172,205,324,219,282,176,1635,201,289,4020,2202,737,2292,3308,1880,2335,2827,202,315,3056,2849,2215,2028,270,2798,3066,2946,2323,125,3308,186,494,2329,21,1476,2343,2269,2190,1032,344,2164,3048,62,302,1628,935,468,128,924,2054,1145,2819,1773,2043,2896,326,799,517,269];
async function loadCoasters(query) {
    const URL = `https://vast-garden-04559.herokuapp.com/https://captaincoaster.com/api/coasters?page=1&name=${query}`;
    const res = await fetch(`${URL}`, {
			headers: {
				'X-AUTH-TOKEN':CC_API_KEY
			}
		})
    const data = await res.json();
    if(data["totalItems"] > 0) displayCoasterList(data["member"]);
}

let debounce;
function findCoasters() {
    let query = (coasterSearchBox.value).trim();
    if(query.length > 0) {
        searchList.classList.remove('hide-search-list');
        clearTimeout(debounce);
        debounce = setTimeout(function() {
            loadCoasters(query);
        }, 300)
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
                    'X-AUTH-TOKEN':CC_API_KEY
                }
            })
            const guess = await result.json();
            console.log(guess);
            if (gamemode == 'daily' && window.localStorage.getItem('gameEnd')) return;
            makeGuess(guess);
        });
    });
}

async function searchById(id) {
    const result = await fetch(`https://vast-garden-04559.herokuapp.com/https://captaincoaster.com/api/coasters/${id}`, {
                headers: {
                    'X-AUTH-TOKEN':CC_API_KEY
                }
            })
    const guess = await result.json();
    console.log(guess);
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
    setUnits();
    setEndlessMode();
    const game = document.getElementById('game');
    var aID;
    if (gamemode == 'endless') {
        if (endlessHardMode) aID = extended_paIDs[Math.floor(Math.random() * extended_paIDs.length)];
        else aID = paIDs[Math.floor(Math.random() * paIDs.length)];
    }
    else aID = getDailyCoaster();
    const URL = `https://vast-garden-04559.herokuapp.com/https://captaincoaster.com/api/coasters/${aID}`;
    const res = await fetch(`${URL}`, {
			headers: {
				'X-AUTH-TOKEN':CC_API_KEY
			}
		})
    const data = await res.json();
    answer=data;
    const res2 = await fetch(`https://vast-garden-04559.herokuapp.com/https://captaincoaster.com${answer.park["@id"]}`, {
        headers: {
            'X-AUTH-TOKEN':CC_API_KEY
        }
    })
    const data2 = await res2.json();
    answerPark=data2;
    answerCountry=answerPark.country.name.substring(8);
    answerCountry = answerCountry[0].toUpperCase() + answerCountry.substring(1);
    /* Fixes */
    if (answer.id == 2111) answer.inversionsNumber = 3;
    if (answer.id == 3056) answer.inversionsNumber = 2;
    if (answer.id == 2006) answer.height = 27;
    if (answer.id == 5612) answer.height = 11;
    if (answer.id == 2896) answer.seatingType.name = "Floorless";
    drawGrid(game);
    updateGrid();
    if (gamemode == 'daily') updateDaily();
    window.localStorage.setItem(`dayLastPlayed`, today);
    if (window.localStorage.getItem(`daySwap`)) {
        window.localStorage.removeItem('daySwap');
        openPopup("gmReset");
    }
    if (window.localStorage.getItem(`update`) != '1') {
        window.localStorage.setItem('update','1');
        //openPopup("updateNotif");
    }
    if (window.localStorage.getItem('gameEnd') && gamemode == 'daily') {
        setTimeout(() => {
            showShareButton();
        }, 6000);
    }
}

startup();

async function makeGuess(guess) {
    const row = state.currentRow;
    if (row > 5) return;
    const res = await fetch(`https://vast-garden-04559.herokuapp.com/https://captaincoaster.com${guess.park["@id"]}`, {
        headers: {
            'X-AUTH-TOKEN':CC_API_KEY
        }
    })
    const data = await res.json();
    guessPark = data;
    /* fixes pt 2 */
    if (guess.id == 2111) guess.inversionsNumber = 3;
    if (guess.id == 3056) guess.inversionsNumber = 2;
    if (guess.id == 2896) guess.seatingType.name = "Floorless";
    if (guess.id == 2006) guess.height = 27;
    if (guess.id == 5612) guess.height = 11;
    let guessCountry = guessPark.country.name.substring(8);
    guessCountry = guessCountry[0].toUpperCase() + guessCountry.substring(1);
    compareStats(guess, guessCountry);
    state.currentRow++;
}

function compareStats(guess, guessCountry) {
    const row = state.currentRow;
    const animation_duration = 700;
    // Name
    setTimeout(() => {
        state.grid[row][0] = guess.name + " - " + guess.park.name;
        updateTile(row,0);
    }, ((1) * animation_duration) / 2);
    document.getElementById(`tile${row}0`).classList.add('animated')
    document.getElementById(`tile${row}0`).style.animationDelay = `${(0 * animation_duration / 2)}ms`;

    // Manufacturer
    setTimeout(() => {
        state.grid[row][2] = guess.manufacturer.name;
        updateTile(row,2);
        if (answer.manufacturer.name==guess.manufacturer.name) document.getElementById(`tile${row}2`).classList.add('correct');
        else document.getElementById(`tile${row}2`).classList.add('wrong');
    }, ((3) * animation_duration) / 2);
    document.getElementById(`tile${row}2`).classList.add('animated')
    document.getElementById(`tile${row}2`).style.animationDelay = `${(2 * animation_duration / 2)}ms`;
//
    // Height
    setTimeout(() => {
        let gHeight = guess.height, aHeight = answer.height;
        if (!usingMetric) {
            gHeight = meterToFt(guess.height);
            aHeight = meterToFt(answer.height);
            state.grid[row][5] = "" + gHeight + " ft";
        }
        else state.grid[row][5] = "" + gHeight + " m";
        updateTile(row,5);
        if (aHeight==gHeight) document.getElementById(`tile${row}5`).classList.add('correct');
        else if (aHeight > gHeight) document.getElementById(`tile${row}5`).classList.add('higher');
        else document.getElementById(`tile${row}5`).classList.add('lower');
    }, ((6) * animation_duration) / 2);
    document.getElementById(`tile${row}5`).classList.add('animated')
    document.getElementById(`tile${row}5`).style.animationDelay = `${(5 * animation_duration / 2)}ms`;

    //Length
    setTimeout(() => {
        let gLength = guess.length, aLength = answer.length;
        if (!usingMetric) {
            gLength = meterToFt(guess.length);
            aLength = meterToFt(answer.length);
            state.grid[row][6] = "" + gLength + " ft";
        }
        else state.grid[row][6] = "" + gLength + " m";
        updateTile(row,6);
        if (aLength==gLength) document.getElementById(`tile${row}6`).classList.add('correct');
        else if (aLength > gLength) document.getElementById(`tile${row}6`).classList.add('higher');
        else document.getElementById(`tile${row}6`).classList.add('lower');
    }, ((7) * animation_duration) / 2);
    document.getElementById(`tile${row}6`).classList.add('animated')
    document.getElementById(`tile${row}6`).style.animationDelay = `${(6 * animation_duration / 2)}ms`;

    //Speed
    setTimeout(() => {
        let gSpeed = guess.speed, aSpeed = answer.speed;
        if (!usingMetric) {
            gSpeed = kmhToMph(guess.speed);
            aSpeed = kmhToMph(answer.speed);
            state.grid[row][7] = "" + gSpeed + " mph";
        }
        else state.grid[row][7] = "" + gSpeed + " km/h";
        updateTile(row,7);
        if (gSpeed==aSpeed) document.getElementById(`tile${row}7`).classList.add('correct');
        else if (aSpeed > gSpeed) document.getElementById(`tile${row}7`).classList.add('higher');
        else document.getElementById(`tile${row}7`).classList.add('lower');
    }, ((8) * animation_duration) / 2);
    document.getElementById(`tile${row}7`).classList.add('animated')
    document.getElementById(`tile${row}7`).style.animationDelay = `${(7 * animation_duration / 2)}ms`;

    //Inversions
    setTimeout(() => {
        state.grid[row][4] = "" + guess.inversionsNumber;
        updateTile(row,4);
        if (answer.inversionsNumber==guess.inversionsNumber) document.getElementById(`tile${row}4`).classList.add('correct');
        else if (answer.inversionsNumber > guess.inversionsNumber) document.getElementById(`tile${row}4`).classList.add('higher');
        else document.getElementById(`tile${row}4`).classList.add('lower');
    }, ((5) * animation_duration) / 2);
    document.getElementById(`tile${row}4`).classList.add('animated')
    document.getElementById(`tile${row}4`).style.animationDelay = `${(4 * animation_duration / 2)}ms`;

    //Country
    setTimeout(() => {
        if (guessCountry == 'Usa' || guessCountry == 'Uk') state.grid[row][1] = "" + guessCountry.toUpperCase();
        else state.grid[row][1] = "" + guessCountry;
        updateTile(row,1);
        if (answerCountry==guessCountry) document.getElementById(`tile${row}1`).classList.add('correct');
        else document.getElementById(`tile${row}1`).classList.add('wrong');
    }, ((2) * animation_duration) / 2);
    document.getElementById(`tile${row}1`).classList.add('animated')
    document.getElementById(`tile${row}1`).style.animationDelay = `${(1 * animation_duration / 2)}ms`;

    //Seating Type
    setTimeout(() => {
        state.grid[row][3] = "" + guess.seatingType.name;
        updateTile(row,3);
        if (answer.seatingType.name==guess.seatingType.name) document.getElementById(`tile${row}3`).classList.add('correct');
        else document.getElementById(`tile${row}3`).classList.add('wrong');
    }, ((4) * animation_duration) / 2);
    document.getElementById(`tile${row}3`).classList.add('animated')
    document.getElementById(`tile${row}3`).style.animationDelay = `${(3 * animation_duration / 2)}ms`;

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
            document.getElementById('msg3').innerHTML=(`<a href="https://www.youtube.com/results?search_query=${answer.name}+${answerPark.name}+pov">Click here to watch a POV!</a>`)
            openPopup("endgame");
            // Remove confetti after animation finishes
            setTimeout(function() {
                stopConfetti();
            }, 3000);
            if(gamemode == 'daily') window.localStorage.setItem('gameEnd','true');
            if(gamemode == 'daily') window.localStorage.setItem('gameState','win');
            if(gamemode == 'daily') showShareButton();
        }
        else if (isGameOver) {
            document.getElementById('hmsg').innerHTML=(`Out of turns :((`);
            document.getElementById('msg').innerHTML=(`The correct answer was ${answer.name} from ${answerPark.name}.`);
            document.getElementById('msg3').innerHTML=(`<a href="https://www.youtube.com/results?search_query=${answer.name}+${answerPark.name}+pov">Click here to watch a POV!</a>`)
            addLoss(gamemode);
            openPopup("endgame");
            if(gamemode == 'daily') window.localStorage.setItem('gameEnd','true');
            if(gamemode == 'daily') window.localStorage.setItem('gameState','loss');
            if(gamemode == 'daily') showShareButton();
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
    return paIDs[(Math.floor(Date.now() / 86400000)-52)%paIDs.length];
}
function checkMaybeSwitch() {
    const dayLastPlayed = window.localStorage.getItem(`dayLastPlayed`);
    window.localStorage.setItem(`dayLastPlayed`, today)
    if (dayLastPlayed != today) {
        for (let i = 1; i < 7; i++) {
            window.localStorage.removeItem(`guess${i}`,);
        }
        window.localStorage.removeItem(`gameEnd`);
        window.localStorage.removeItem(`gameState`);
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
        window.localStorage.removeItem(`gameState`);
    }
    else {
        const timer = ms => new Promise(res => setTimeout(res, ms));
        for (let i = 1; i < 7; i++) {
            const currGuess = window.localStorage.getItem(`guess${i}`);
            if (currGuess) {
                let guessID = parseInt(currGuess);
                const result = await fetch(`https://vast-garden-04559.herokuapp.com/https://captaincoaster.com/api/coasters/${guessID}`, {
                    headers: {
                        'X-AUTH-TOKEN':CC_API_KEY
                    }
                })
                const guess = await result.json();
                console.log(guess);
                await makeGuess(guess);
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
        const trophies = window.localStorage.getItem(`trophies`);
        if (!trophies) window.localStorage.setItem(`trophies`, answer.id);
        else localStorage.setItem(`trophies`,(trophies+','+answer.id));
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
// EMOJI SPREAD THE PROPAGANDA MUAHAHAHAHAHA!!!!
function emoji() {
    let firstMsg = "Coastle "+(today-19436);
    let msg = "";
    let sixTurns = true;
    loop1:
    for (let i = 0; i < state.grid.length; i++) {
        msg += "\n";
        for (let j = 1; j < state.grid[i].length - 1; j++) {
            const tile = document.getElementById(`tile${i}${j}`);
            if(tile.classList.contains('lower')) msg += "⬇️";
            else if(tile.classList.contains('higher')) msg += "⬆️";
            else if(tile.classList.contains('wrong')) msg += "🟥";
            else if(tile.classList.contains('correct')) msg += "🟩";
            else break loop1;
        }
    }
    if (localStorage.getItem('gameState')=='loss') firstMsg += ` X/6`
    else firstMsg += ` ${state.currentRow}/6`;
    msg = firstMsg + msg;
    return msg;
}

function emojiPropagandaVer() {
    let firstMsg = "Coastle%20"+(today-19436);
    let msg = "";
    loop1:
    for (let i = 0; i < state.grid.length; i++) {
        msg += "%0A";
        for (let j = 1; j < state.grid[i].length - 1; j++) {
            const tile = document.getElementById(`tile${i}${j}`);
            if(tile.classList.contains('lower')) msg += "⬇️";
            else if(tile.classList.contains('higher')) msg += "⬆️";
            else if(tile.classList.contains('wrong')) msg += "🟥";
            else if(tile.classList.contains('correct')) msg += "🟩";
            else break loop1;
        }
    }
    if (localStorage.getItem('gameState')=='loss') firstMsg += ` X/6 %23coastle`
    else firstMsg += ` ${state.currentRow}/6 %23coastle`;
    msg = firstMsg + msg + "https://pkyu.github.io/coastle/";
    return msg;
}

function showShareButton() {
    var s = document.getElementById('shareButtonJumpscare');
    document.getElementById(`tile08`).classList.add('fades')
    document.getElementById(`tile08`).innerHTML = `
        <button onclick="openPopup('copy');
        copyResult();">
            <img src="assets/copy.png">
        </button>
    `;
    document.getElementById(`tile18`).classList.add('fades')
    document.getElementById(`tile18`).innerHTML = `
        <a href="https://twitter.com/intent/tweet?text=${emojiPropagandaVer()}"">
            <img src="assets/tweet.png">
        </a>
    `;
}

function copyResult() {
  navigator.clipboard.writeText(emoji());
}
function tk() {
    return atob('YjE1NGY0ZDQtYmJkYS00MDRiLWFlM2UtZWE5NTlmNjgxMjBk');
}
// Settings
function setUnits() {
    usingMetric = (localStorage.getItem('usingMetric') === 'true');
    document.getElementById('unitCheck').checked = (usingMetric);
}
function setEndlessMode() {
    endlessHardMode = (localStorage.getItem('endlessHardCheck') === 'true');
    document.getElementById('endlessHardCheck').checked = (endlessHardMode);
}
function swapUnits() {
    usingMetric = !usingMetric;
    localStorage.setItem('usingMetric',usingMetric);
}
function swapEndlessMode() {
    endlessHardMode = !endlessHardMode;
    localStorage.setItem('endlessHardCheck',endlessHardMode);
}
function meterToFt(num) {
    return Math.round(num * 3.28084);
}
function kmhToMph(num) {
    return Math.round(num * 0.6213709999975642);
}