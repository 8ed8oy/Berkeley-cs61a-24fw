const antDescriptions = {
    Harvester: '每回合+1食物',
    Thrower: '基础远程1伤害，无射程无限',
    Short: '射程≤3格的投掷蚂蚁',
    Long: '射程≥5格的投掷蚂蚁',
    Fire: '被击败时对同格蜂造成额外爆炸伤害',
    Wall: '高血量阻挡',
    Hungry: '吞噬同格蜂，冷却2回合',
    Bodyguard: '容器，可保护并携带一只蚂蚁',
    Tank: '容器，溅射1点伤害并保护同格蚂蚁',
    Scuba: '防水投掷蚂蚁，可放水里',
    Slow: '使目标减速5回合，不造成伤害',
    Scary: '使目标后退2步，不造成伤害',
    Ninja: '不阻挡路径，对经过的蜂造成1伤害',
    Laser: '沿直线递减伤害，穿透敌我',
    Queen: '唯一，双倍身后蚂蚁伤害并投掷'
};


function formatAntButtons(antTypes, antCosts) {
    // Create buttons for each type of ant

    let antSection = document.querySelector('.ants-section');
    for (i = 0; i < antTypes.length; i++) {
        let name = antTypes[i];
        let antButton = document.createElement('button');
        antButton.setAttribute('class', `ant-btn`);
        antButton.setAttribute('id', name);
        antButton.style.backgroundImage = `url('../static/assets/ants/${name}.gif')`;
        let costText = antCosts && antCosts[name] !== undefined ? ` (食物:${antCosts[name]})` : '';
        antButton.title = (antDescriptions[name] || '蚂蚁') + costText;
        antSection.appendChild(antButton);
        selectedAntsTable[name] = false; // Add key value pairs to table (key = ant name, val = whether it's selected)
    }

    // Add shovel button to remove placed ants
    let shovelButton = document.createElement('button');
    shovelButton.setAttribute('class', 'ant-btn shovel-btn');
    shovelButton.setAttribute('id', 'shovel-btn');
    shovelButton.innerText = 'Shovel';
    shovelButton.title = '铲除已放置的蚂蚁';
    antSection.appendChild(shovelButton);

    addListenerToAnts(); // Add event listener to ant button
}


function formatGameGrid(rows, cols, wetPlaces) {
    let gameSectionStyle = document.querySelector(".game-section").style;
    let maxWidth = 12; // Maximun tunnel length = 12

    if (0 < cols <= maxWidth) {
        // Determine space occupied by grids vs hive according to num of cols
        gameSectionStyle.gridTemplateColumns = `${cols / maxWidth}fr ${(maxWidth - cols) / maxWidth}fr`;
    } else {
        console.log("===== ERROR: number of columns not supported =====");
    }

    addRowsToGrid(rows); // Add rows to grid
    for (i = 0; i < rows; i++) {
        createButtonsForRow(cols, i, wetPlaces); // Add buttons to row
    }
    formatHive();
    addListenerToTile(); // Add event listener to tile
}


function addRowsToGrid(rows) {
    /* Add rows to game grid */

    let s = '';
    let tunnelGrid = document.querySelector(".tunnel-grid");

    for (i = 0; i < rows; i++){
        if (i === rows - 1) {
            s += `1fr`;
        } else {
            s += `1fr `;
        }
        let row = document.createElement('div');
        row.setAttribute('class', `tunnel-row-${i}`);
        row.style.display = 'flex'; // Make every row a flex box
        row.style.justifyContent = 'space-between';
        tunnelGrid.appendChild(row);
    }

    tunnelGrid.style.gridTemplateRows = s; // Set tunnelGrid as CSS grid with correct number of fr
}


function createButtonsForRow(buttonCount, row, wetPlaces) {
    // Add buttons (tiles) for given row

    for (let i = 0; i < buttonCount; i ++) {
        let button = document.createElement('button');
        button.setAttribute('class', `tile-btn`);
        button.setAttribute('id', `${row}-${i}`);
        let image = document.createElement('img');
        image.setAttribute('src', `../static/assets/tiles/${i % 3}.png`);

        for (let j = 0; j < wetPlaces.length; j++) { // Check every wet place to see if is current place
            if (wetPlaces[j][0] === row && wetPlaces[j][1] === i) {
                image.setAttribute('src', `../static/assets/tiles/wet.png`); // Set src as wet place
                break;
            }
        }

        image.setAttribute('class', `tile-img`);
        button.appendChild(image);
        document.querySelector(`.tunnel-row-${row}`).appendChild(button);
    }
}


function formatHive() {
    // Set up and add image to bee hive
    hive = document.querySelector(".beehive");
    hive.style.position = 'relative';
    hive.style.overflow = 'hideen';
    image = document.createElement('img');
    image.setAttribute('src', `../static/assets/fog.jpg`);
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';
    image.style.opacity = '85%';
    hive.appendChild(image);
}


function makeAntSelector(antName) {
    /* Returns an antSelector func, which will be called when button pressed */

    function antSelector() {
        for (let ant in selectedAntsTable) {
            /* Loop thru every ant type.
            If type is selected, reflect in table and change border color.
            Reset all other types in table and color */
            let antButton = document.getElementById(ant);
            if (ant === antName) {
                selectedAntsTable[ant] = true;
                antButton.style.borderWidth = '5px';
                antButton.style.borderColor = 'rgba(50, 20, 200, 0.8)';

            } else {
                selectedAntsTable[ant] = false;
                antButton.style.borderWidth = '2px';
                antButton.style.borderColor = 'rgba(54, 57, 235, 0.2)';
            }
        }
        window.shovelSelected = false;
        highlightShovel(false);
    }

    return antSelector;
}


function addListenerToAnts() {
    /* Add event listener to every ant button */

    let buttons = document.getElementsByClassName('ant-btn');
    for (i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', makeAntSelector(buttons[i].id));
    }
}


function getSelectedAnt() {
    // Return selected ant from table, or undefined if no ants selected
    for (let ant in selectedAntsTable){
        if (selectedAntsTable[ant]){
            return ant;
        }
    }
}


function makeOnClickTile(buttonID) {
    /* Returns a func, which is called when tile button is clicked */

    function onClickTile() {
        // Shovel mode removes an ant instead of placing
        if (window.shovelSelected) {
            fetch('/remove_ant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pos: buttonID }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.removed) {
                    removeAntFromTile(buttonID);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
            return;
        }

        // Check if an ant is selected
        selectedAnt = getSelectedAnt();
        if (selectedAnt == undefined){
            return;
        }

        // Prepare data to sent to server (which button and what ant)
        const data = {
            pos: buttonID,
            ant: selectedAnt
        };

        fetch('/deploy_ants', { // Send an AJAX request to Flask server by signaling deploy_ants
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => { // Handle incoming data from server
            deployed = data.deployed;
            if (deployed){ // Successfuly deployed
                placeAnt(selectedAnt, buttonID, data.insect_id);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }

    return onClickTile;
}


function addListenerToTile() {
    // Add event listener to every tile button
    let buttons = document.getElementsByClassName('tile-btn');
    for (i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', makeOnClickTile(buttons[i].id));
    }
}


function populateInsects(insects) {
    if (!insects || insects.length === 0) return;
    // Clear any prior renders to avoid duplicates
    let buttons = document.getElementsByClassName('tile-btn');
    for (let i = 0; i < buttons.length; i++) {
        let imgs = buttons[i].querySelectorAll('.insect-on-tile-img');
        imgs.forEach(img => img.remove());
    }
    insects.forEach(item => {
        let placeId = `${item.pos[0]}-${item.pos[1]}`;
        if (item.kind === 'ant') {
            placeAnt(item.name, placeId, item.id);
        } else if (item.kind === 'bee') {
            placeBee(item.name, placeId, item.id);
        }
    });
}


function placeBee(beeName, placeId, bee_id) {
    let destination = document.getElementById(placeId);
    if (!destination) return;
    let beeImg = document.createElement('img');
    destination.appendChild(beeImg);
    beeImg.setAttribute('class', 'insect-on-tile-img');
    beeImg.setAttribute('id', bee_id);
    beeImg.setAttribute('src', `../static/assets/bees/${beeName}.gif`);
    beeImg.style.zIndex = '5';
    beeImg.style.top = `${(destination.offsetHeight - beeImg.offsetHeight) / 2}px`;
}


function placeAnt(antName, place, ant_id) {
    // Place an ant on GUI
    let image = document.createElement('img');
    let button = document.getElementById(place);

    image.setAttribute('class', 'insect-on-tile-img');
    image.setAttribute('src', `../static/assets/ants/${antName}.gif`);
    image.setAttribute('id', ant_id);
    button.appendChild(image);

    // Center the ant at the botton
    image.style.top = `50%`;
    image.style.left = `50%`;
    image.style.transform = 'translate(-50%, -50%)';
}


function removeAntFromTile(place) {
    // Remove the first ant image on a tile, if present
    let button = document.getElementById(place);
    if (!button) return;
    let images = button.querySelectorAll('.insect-on-tile-img');
    images.forEach(img => img.remove());
}


function adjustAntButtons(availableAnts) {
    // Increase brightness of available ants (enough food to de deployed), and decrease unavailable ants
    let antButtons = document.getElementsByClassName('ant-btn');
    for (i = 0; i < antButtons.length; i++) {
        let button = antButtons[i];
        if (availableAnts.includes(button.id)) {
            button.style.filter = 'brightness(100%)';
        } else {
            button.style.filter = 'brightness(35%)';
        }
    }
}


function showEndGameAlert(result) {
    // Display alert message. Called when game ends.
    let body = document.body;
    let alert = document.createElement('alert');
    alert.style.opacity = '0'; // Set initial opacity to 0
    body.appendChild(alert);
    alert.setAttribute('class', 'alert');
    let text = document.createElement('p');
    alert.appendChild(text);

    if (result) { // Ants won
        text.innerText = 'You Won!';
        alert.style.backgroundColor = 'rgba(30, 200, 50, 1)';
    } else {
        text.innerText = 'You Lost!';
        alert.style.backgroundColor = 'rgba(190, 40, 50, 1)';
    }

    alert.style.transition = 'opacity 2s ease-in-out';
    setTimeout(() => { // Need time out for animation
        alert.style.opacity = '0.9'; // Change alert opacity to 90% over 2 seconds
    }, 50);
}


function playMusic() {
    // Play music
    let audio = document.getElementById('backgroundmusic');
    audio.play();
}


