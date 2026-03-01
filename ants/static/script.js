const socket = io.connect(); // connect to websocket
var selectedAntsTable = {}; // store name for every type of ant as key, and boolean whether that ant is selected as value
const moveBeeAnimationDuration = 1.2; // seconds
const throwLeafAnimationDuration = 0.75; // seconds
const insectDieAnimationDuration = 0.6; // seconds
const insectsHurtAnimationDuration = 0.2; // seconds
const insectsActionInterval = 5; // Slow down action loop to reduce load
const statsUpdateInterval = 250; // Throttle stats polling to lighten the UI thread
let statsUpdateInFlight = false; // Prevent overlapping stats requests that stall Edge
let actionIntervalId = null;
let statsIntervalId = null;
let isPaused = false;
window.shovelSelected = false;


function inLobby(data) {
    /* Triggered by backend once player connects to server
    Player is in lobby. Game waiting to be started. */

    let main = document.querySelector(".main-window");
    main.style.opacity = '0'; // Hide main window so lobby background image is visible
    let startButton = document.querySelector('.start-button');
    startButton.addEventListener('click', startGame); // Add event listener to Start button
}


function startGame() {
    /* Trigered when player clicks Start button
    Fecth initial data from server. Set up game grid. */

    console.log("===== Game Started! =====");

    fetch('/initialize_game', { // Send initialize_game signal to backend
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Sending empty data
    })
    .then(response => response.json())
    .then(data => { // Handling incoming data from server

        let main = document.querySelector(".main-window");
        main.style.opacity = '1'; // Make main window visible

        let body = document.getElementsByTagName("BODY")[0];
        body.style.backgroundImage = 'none'; // Remove lobby background image
        let startButton = document.querySelector('.start-button');
        startButton.remove(); // Remove start button

            formatAntButtons(data.ant_types, data.ant_costs); // Set up ant buttons according to available ant types
        formatGameGrid(data.dimensions_x, data.dimensions_y, data.wet_places); // Set up game grid
            populateInsects(data.insects);
        playMusic();
        bindControlButtons();
        bindShovelButton();
        attachAntSelectionReset();

        startLoops();
        setToggleButtonLabel('Pause');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


function startLoops() {
    // Start periodic actions and stats polling
    clearLoops();
    actionIntervalId = setInterval(insectsTakeActions, insectsActionInterval * 1000);
    statsIntervalId = setInterval(updateStats, statsUpdateInterval);
    isPaused = false;
}


function clearLoops() {
    if (actionIntervalId) {
        clearInterval(actionIntervalId);
        actionIntervalId = null;
    }
    if (statsIntervalId) {
        clearInterval(statsIntervalId);
        statsIntervalId = null;
    }
}


function pauseGame() {
    if (isPaused) return;
    clearLoops();
    isPaused = true;
    setToggleButtonLabel('Start');
    fetch('/save_state', { method: 'POST' });
}


function resumeGame() {
    if (!isPaused) return;
    startLoops();
    setToggleButtonLabel('Pause');
}


function restartGame() {
    clearLoops();
    fetch('/restart_game', { method: 'POST' })
        .then(() => {
            window.location.reload();
        });
}


function togglePause() {
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}


function bindControlButtons() {
    let toggleBtn = document.querySelector('.toggle-play-btn');
    let restartBtn = document.querySelector('.restart-btn');
    let saveBtn = document.querySelector('.save-btn');
    let clearBtn = document.querySelector('.clear-cache-btn');
    if (toggleBtn) toggleBtn.addEventListener('click', togglePause);
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    if (saveBtn) saveBtn.addEventListener('click', manualSave);
    if (clearBtn) clearBtn.addEventListener('click', clearCache);
}


function setToggleButtonLabel(text) {
    let toggleBtn = document.querySelector('.toggle-play-btn');
    if (toggleBtn) toggleBtn.innerText = text;
}


function manualSave() {
    fetch('/save_state', { method: 'POST' });
}


function bindShovelButton() {
    let shovelBtn = document.getElementById('shovel-btn');
    if (!shovelBtn) return;
    shovelBtn.addEventListener('click', () => {
           window.shovelSelected = true;
        highlightShovel(true);
        // Deselect ants
        for (let ant in selectedAntsTable) {
            selectedAntsTable[ant] = false;
            let antButton = document.getElementById(ant);
            if (antButton) {
                antButton.style.borderWidth = '2px';
                antButton.style.borderColor = 'rgba(54, 57, 235, 0.2)';
            }
        }
    });
}


function attachAntSelectionReset() {
    let buttons = document.getElementsByClassName('ant-btn');
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].id === 'shovel-btn') {
            continue;
        }
        buttons[i].addEventListener('click', () => {
                window.shovelSelected = false;
            highlightShovel(false);
        });
    }
}


function highlightShovel(selected) {
    let shovelBtn = document.getElementById('shovel-btn');
    if (!shovelBtn) return;
    shovelBtn.style.borderWidth = selected ? '5px' : '2px';
    shovelBtn.style.borderColor = selected ? 'rgba(200, 80, 20, 0.9)' : 'rgba(54, 57, 235, 0.2)';
}


function moveBee(data) {
    /* Triggered by backend. Moves a bee */

    let animationDelay = 50;

    setTimeout(() => { // Must use timeout to enable animations
        let destination = document.getElementById(`${data.destination[0]}-${data.destination[1]}`);
        let currentTile = document.getElementById(`${data.current_pos[0]}-${data.current_pos[1]}`);
        let distance = destination.getBoundingClientRect().right - currentTile.getBoundingClientRect().right; // Calculate distance
        let beeImg = document.getElementById(`${data.bee_id}`);

        beeImg.style.transition = `transform ${moveBeeAnimationDuration}s ease-in-out`; // Translate bee in 1.5 seconds
        beeImg.style.transform = `translateX(${distance}px)`;
        beeImg.style.top = `${(destination.offsetHeight - beeImg.offsetHeight) / 2}px`; // Sets the sprite to be in the middle of the tunnel

        // Remove from current tile and add to destination
        setTimeout(() => {
            beeImg.remove();
            destination.appendChild(beeImg);
            beeImg.style.transform = `translateX(0px)`;
            beeImg.style.top = `${(destination.offsetHeight - beeImg.offsetHeight) / 2}px`;
        }, moveBeeAnimationDuration * 1000 + animationDelay);

    }, animationDelay * 2);
}


function moveBeeFromHive(data) {
    // Triggered by backend. Move a bee from hive.

    let animationDelay = 75; // milliseconds

    setTimeout(() => {
        let beeImg = document.createElement('img');
        let destination = document.getElementById(`${data.destination[0]}-${data.destination[1]}`);
        destination.appendChild(beeImg);
        beeImg.setAttribute('class', 'insect-on-tile-img');
        beeImg.setAttribute('id', data.bee_id);
        beeImg.setAttribute('src', `../static/assets/bees/${data.bee_name}.gif`)
        beeImg.style.zIndex = '5'; // Set bee image on top of tile image

        let offset = destination.getBoundingClientRect().right - beeImg.getBoundingClientRect().right;
        beeImg.style.transition = `transform ${moveBeeAnimationDuration}s ease-in-out`;
        beeImg.style.top = `${(destination.offsetHeight - beeImg.offsetHeight) / 2}px`;

        setTimeout(() => {
            beeImg.style.transform = `translateX(${offset}px)`;
            beeImg.style.top = `${(destination.offsetHeight - beeImg.offsetHeight) / 2}px`;
        }, animationDelay);


        setTimeout(() => { // Append to new parent, reset translate
            beeImg.style.transition = '';
            beeImg.style.transform = `translateX(0px)`;
            beeImg.style.left = `0px`;
        }, moveBeeAnimationDuration * 1000 + animationDelay * 2);

    }, animationDelay * 2);
}


function removeInsect(data) {
    // Triggered by backend. Remove insect from GUI. However, this is a little buggy with the feature of insects turning red upon receiving damage

    setTimeout(() => {
        let insect = document.getElementById(data.insect_id);
        let animationDelay = 50; // milliseconds
        insect.style.transition = `opacity ${insectDieAnimationDuration}s ease-out`;
        insect.style.opacity = '0';
        setTimeout(() => {
            insect.remove(); // Remove html element
        }, insectDieAnimationDuration * 1000 + animationDelay)
    }, throwLeafAnimationDuration * 1000 + insectsHurtAnimationDuration * 1000)
}


function endGame(data) {
    // Triggered by backend. End game.

    showEndGameAlert(data.antsWon)
    let mainWindow = document.querySelector('.main-window');
    mainWindow.style.transition = 'filter 2s ease-in-out';
    mainWindow.style.filter = 'brightness(35%)'; // Decrease brightness of game
}


function insectsTakeActions() {
    /* Called on interval. Ask insects to take actions */

    const timeDelay = 100; // milliseconds

    fetch('/ants_take_actions') // Triger insects_take_actions signal in backend for ants to take actions
    .then(response => response.json())
    .then(data => { // Handle data from backend
    })
    .catch(error => {
        console.error('Error:', error);
    });

    setTimeout(() => { // Leave time between ants taking action and bees taking action for the animation to play (leaf reach bee and bee turning red)
        fetch('/bees_take_actions') // Triger insects_take_actions signal in backend for bees to take actions
        .then(response => response.json())
        .then(data => {
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }, throwLeafAnimationDuration * 1000 + insectsHurtAnimationDuration * 1000 + timeDelay);
}


function updateStats() {
    /* Called on interval. Ask server for food count and turn count */

    if (statsUpdateInFlight) {
        return; // Avoid piling up requests if Edge lags
    }
    statsUpdateInFlight = true;

    fetch('/update_stats') // Triger update_stats signal in server
    .then(response => response.json())
    .then(data => { // Handle data from server
        let food = data.food;
        let turn = data.turn;
        let maxTurn = data.max_turn;
        let food_display = document.querySelector('.display-food-div');
        food_display.innerText = `Food: ${food}`;
        food_display = document.querySelector('.display-turn-div');
        food_display.innerText = `Turn: ${turn}`;
        let max_turn_display = document.querySelector('.max-turn-display');
        if (max_turn_display) {
            max_turn_display.innerText = `Max Turn: ${maxTurn}`;
        }
        adjustAntButtons(data.available_ants); // Update GUI on what ants are available
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
        statsUpdateInFlight = false;
    });
}


function reduceHealth(data) {
    /* Triggered by backend. Animates insects turning red upon receiving damage */

    const animationDelay = 100; // milliseconds

    setTimeout(() => {
        let insectImg = document.getElementById(data.insect_id);
        setTimeout(() => {
            insectImg.style.transition = '';
            insectImg.style.filter = "invert(67%) sepia(89%) saturate(7492%) hue-rotate(346deg) brightness(84%) contrast(146%)";
        }, animationDelay)
        setTimeout(() => {
            insectImg.style.transition = '';
            insectImg.style.filter = 'none';
        }, animationDelay + 1000 * insectsHurtAnimationDuration)
    }, throwLeafAnimationDuration * 1000)
}


function throwAt(data) {
    // Triggered by back end. Animates an ant throwing a leaf at a bee

    let target = document.getElementById(`${data.target_pos[0]}-${data.target_pos[1]}`);
    let thrower = document.getElementById(`${data.thrower_pos[0]}-${data.thrower_pos[1]}`);
    let distance = target.getBoundingClientRect().left - thrower.getBoundingClientRect().right;
    let offset = thrower.getBoundingClientRect().left - thrower.getBoundingClientRect().right;
    let leafImg = document.createElement('img');
    let animationDelay = 25 // milliseonds

    thrower.appendChild(leafImg);
    leafImg.setAttribute('src', '../static/assets/testLeaf.png');
    leafImg.setAttribute('class', 'leaf-on-tile-img');

    leafImg.style.transform = `translateX(${offset}px)`;
    leafImg.style.transition = `transform ${throwLeafAnimationDuration}s ease-in`;
    leafImg.style.top = `${(target.offsetHeight - leafImg.offsetHeight) / 2}px`;
    setTimeout(() => {
        leafImg.style.transform = `translateX(${distance}px)`;
        leafImg.style.top = `${(target.offsetHeight - leafImg.offsetHeight) / 2}px`;
    }, animationDelay);

    setTimeout(() => {
        leafImg.remove();
    }, animationDelay * 2 + throwLeafAnimationDuration * 1000);

}


// Handle incoming signals from server. These functions are triggered by backend.
socket.on('loadLobby', inLobby);
socket.on('moveBee', moveBee);
socket.on('moveBeeFromHive', moveBeeFromHive);
socket.on('onInsectDeath', removeInsect);
socket.on('endGame', endGame);
socket.on('throwAt', throwAt);
socket.on('reduceHealth', reduceHealth);


// Persist state on tab close
window.addEventListener('beforeunload', function() {
    navigator.sendBeacon('/save_state');
    clearLoops();
});

// Clear cache/save manually from UI
function clearCache() {
    fetch('/clear_cache', { method: 'POST' })
        .then(() => window.location.reload());
}

