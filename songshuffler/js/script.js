// UI Elements
const skipBtn = document.querySelectorAll('.skip-btn');
const counterEl = document.querySelector('#counter');
const moodFill = document.querySelector('#mood-fill');
const moodFace = document.querySelector('#mood-face');
const songTitleEl = document.querySelectorAll('.ipod-title');
const batteryTextEl = document.querySelectorAll('.ipod-battery');
const rechargeBtn = document.querySelector('#recharge-btn');
const ipodLevelEl = document.querySelector('#ipod-level');
const headphoneLevelEl = document.querySelector('#headphone-level');
const shopModal = document.querySelector('#shop-modal');
const ipodShop = document.querySelector('#ipod-shop');
const headphoneShop = document.querySelector('#headphone-shop');
const timerEl = document.querySelector('#timer');
const miniIpodShop = document.querySelector('#miniipod-shop');
const songProgress = document.querySelectorAll('.song-progress');
const pauseOverlay = document.querySelector('.pause-overlay');
const pauseBtn = document.querySelector('#pause-game');
const gameOverScreen = document.querySelector('.game-over');
const resetBtn = document.querySelector('#reset-game');
const saevBtn = document.querySelector('#save-game');
const loadBtn = document.querySelector('#load-game');
const autosaveBtn = document.querySelector('#autosave-game');

let burntOut = false;

// Game State
let points = 0;
let mood = 100;
let battery = 100;
let lastClickTime = Date.now();
let songList = [];
let ipodIndex = 0;
let headphoneLevel = 0;
let isCharging = false;
let gameSeconds = 0;
let miniIpodsOwned = 0;

let songTimer = null;
let songDuration = 0;
let songElapsed = 0;

let isPaused = false;
let timersPaused = [];

let autosave = 0;

// iPod models
const ipods = [
    ["3rd Gen", 100, 0], //100 0
    ["4th Gen", 200, 300], //200 300
    ["5th Gen", 400, 900], // 400, 900
    ["6th Gen", 800, 2000], // 800 2000
    ["Touch 4th Gen", 1600, 8000], //1600 8000
    ["Touch 6th Gen", 3200, 15000] // 3200 1500
];


const ipodModels = {
    0: document.querySelector('#third-gen'),
    1: document.querySelector('#fourth-gen'),
    2: document.querySelector('#fifth-gen'),
    3: document.querySelector('#sixth-gen'),
    4: document.querySelector('#touch-4th'),
    5: document.querySelector('#touch-6th'),
};



// Headphones
const headphones = [
    ["Basic", 1, 0],
    ["Mid", 0.75, 200],
    ["Premium", 0.5, 500],
    ["Studio", 0.3, 1000]
];



const startSongProgress = (lengthStr) => {
    songProgress.forEach(progressBar => {
        clearInterval(songTimer);
        const parts = lengthStr.split(':').map(n => parseInt(n));
        songDuration = parts.length === 2 ? parts[0] * 60 + parts[1] : 180; // fallback to 180s
        songElapsed = 0;
        progressBar.style.width = '0%';
    });


};


// Load song titles
fetch('songs.txt')
    .then(response => {
        if (!response.ok) throw new Error('Failed to load songs');
        return response.text();
    })
    .then(data => {
        songList = data.split('\n')
            .map(s => s.trim())
            .filter(s => s)
            .map(line => {
                const [title, artist, album, length] = line.split('|').map(part => part.trim());
                return { title, artist, album, length };
            });
        newSong();
        renderShop();
        updateUpgradesUI();
    })
    .catch(err => {
        console.error("Could not load songs.txt", err);
        songTitleEl.textContent = "Error loading songs";
    });

// Update song display
const newSong = () => {
    if (songList.length > 0) {
        const song = songList[Math.floor(Math.random() * songList.length)];

        document.querySelectorAll('.ipod-title').forEach(text => {
            text.textContent = song.title;
        });
        document.querySelectorAll('.ipod-artist').forEach(text => {
            text.textContent = song.artist;
        });
        document.querySelectorAll('.ipod-album').forEach(text => {
            text.textContent = song.album;
        });
        document.querySelectorAll('.ipod-length').forEach(text => {
            text.textContent = song.length;
        });
        startSongProgress(song.length);
    }

    songTimer = setInterval(() => {
        songElapsed++;
        const percent = Math.min(100, (songElapsed / songDuration) * 100);
        songProgress.forEach(progressBar => {
            progressBar.style.width = percent + '%';
            if (songElapsed >= songDuration) {
                clearInterval(songTimer);
                skipSong(); // simulate next song
            }
        });

    }, 1000);
};



const updateBars = () => {
    const batteryPercent = (battery / ipods[ipodIndex][1]) * 100;
    batteryTextEl.forEach(battery => {
        battery.textContent = `Battery: ${Math.floor(batteryPercent)}%`;
    });

    moodFill.style.height = `${mood}%`;
    moodFace.textContent = mood > 70 ? "😀" : mood > 40 ? "😐" : mood > 10 ? "😟" : "😵";
};

const updateUpgradesUI = () => {
    ipodLevelEl.textContent = ipods[ipodIndex][0];
    headphoneLevelEl.textContent = headphones[headphoneLevel][0];
};

const updateMiniIpodIcons = () => {
    const iconContainer = document.querySelector('#icons');
    iconContainer.innerHTML = ''; // Clear current icons

    for (let i = 0; i < miniIpodsOwned; i++) {
        const icon = document.createElement('img');
        icon.src = 'images/miniipod.png'; // adjust the path to your actual image
        icon.alt = 'Mini iPod';
        icon.classList.add('mini-ipod-icon');
        iconContainer.appendChild(icon);
    }
};

const renderShop = () => {
    ipodShop.innerHTML = '';
    headphoneShop.innerHTML = '';
    miniIpodShop.innerHTML = '';

    ipods.forEach((ipod, index) => {
        if (index <= ipodIndex) return;
        const btn = document.createElement('button');
        btn.textContent = `${ipod[0]} - ${ipod[2]} pts`;
        btn.onclick = () => {
            if (points >= ipod[2]) {
                points -= ipod[2];
                ipodModels[ipodIndex]?.classList.add('hidden');
                ipodModels[index]?.classList.remove('hidden');
                ipodIndex = index;
                battery = ipods[ipodIndex][1];
                updateBars();
                updateUpgradesUI();
                renderShop();
                shopModal.classList.add('hidden');

            }
        };
        ipodShop.appendChild(btn);
    });


    headphones.forEach((hp, index) => {
        if (index <= headphoneLevel) return;
        const btn = document.createElement('button');
        btn.textContent = `${hp[0]} - ${hp[2]} pts`;
        btn.onclick = () => {
            if (points >= hp[2]) {
                points -= hp[2];
                headphoneLevel = index;
                updateBars();
                updateUpgradesUI();
                renderShop();
                shopModal.classList.add('hidden');
            }
        };
        headphoneShop.appendChild(btn);
    });

    // Mini iPods
    const cost = 250 + miniIpodsOwned * 150;
    const miniBtn = document.createElement('button');
    miniBtn.textContent = `Buy Mini iPod - ${cost} pts (Own ${miniIpodsOwned})`;
    miniBtn.onclick = () => {
        if (points >= cost) {
            points -= cost;
            miniIpodsOwned++;
            updateCounter();
            updateMiniIpodIcons();
            renderShop();
        }
    };
    miniIpodShop.appendChild(miniBtn);
};

const gameOver = () => {
    burntOut = true;
    skipBtn.forEach(button => {
        button.style.opacity = 0.5;
    });
    pauseOverlay.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    localStorage.removeItem('ipodGameSave');
    timersPaused.forEach(clearInterval);
};

const saveGame = () => {
    const saveData = {
        points,
        mood,
        battery,
        ipodIndex,
        headphoneLevel,
        gameSeconds,
        miniIpodsOwned
    };
    localStorage.setItem('ipodGameSave', JSON.stringify(saveData));

    console.log("Saved game!");
};

const loadGame = () => {
    const saved = localStorage.getItem('ipodGameSave');
    if (saved) {
        const data = JSON.parse(saved);
        points = data.points || 0;
        mood = data.mood || 100;
        battery = data.battery || ipods[ipodIndex][1];
        ipodIndex = data.ipodIndex || 0;
        headphoneLevel = data.headphoneLevel || 0;
        gameSeconds = data.gameSeconds || 0;

        updateBars();
        updateUpgradesUI();
        counterEl.textContent = Math.floor(points);

        // Show correct iPod SVG
        Object.values(ipodModels).forEach(el => el.classList.add('hidden'));
        ipodModels[ipodIndex]?.classList.remove('hidden');

        miniIpodsOwned = data.miniIpodsOwned || 0;
        updateMiniIpodIcons();
    }
};

const rechargeBattery = () => {
    //autosave logic
    if (autosave == 1) {
        saveGame();
    }

    isCharging = true;
    skipBtn.forEach(button => {
        button.style.pointerEvents = 'none';
    });
    rechargeBtn.hidden = false;
    songTitleEl.textContent = "Charging...";
    rechargeBtn.classList.add('selected');

    setTimeout(() => {
        battery = ipods[ipodIndex][1];
        updateBars();
        isCharging = false;

        rechargeBtn.classList.remove('selected');
        skipBtn.forEach(button => {
            button.style.pointerEvents = 'auto';
        });
        newSong();
    }, 10000); // 10 seconds
};

const skipSong = () => {
    if (burntOut) return;
    if (isPaused) return;

    const now = Date.now();
    if (battery <= 0 || isCharging) {
        rechargeBattery();
        return;
    }

    battery -= 2;
    const decayRate = 1.5 * headphones[headphoneLevel][1];
    mood = Math.max(0, mood - decayRate);
    lastClickTime = now;

    if (mood <= 0) {
        gameOver();
        return;
    }

    const multiplier = mood > 75 ? 2 : mood > 40 ? 1.5 : 1;
    points += multiplier;

    counterEl.textContent = Math.floor(points);
    updateBars();
    newSong();
};

const restartAllTimers = () => {
    timersPaused.push(setInterval(() => {
        gameSeconds++;
        timerEl.textContent = `Timer: ${gameSeconds}s`;
    }, 1000));

    timersPaused.push(setInterval(() => {
        for (let i = 0; i < miniIpodsOwned; i++) {
            skipSong();
        }
    }, 1000));

    timersPaused.push(setInterval(() => {
        const now = Date.now();
        const timeSinceClick = now - lastClickTime;
        if (timeSinceClick > 200 && mood < 100 && !isCharging) {
            mood = Math.min(100, mood + 0.5);
            updateBars();

            if (burntOut && mood > 20) {
                burntOut = false;
                skipBtn.forEach(button => {
                    button.style.opacity = 1;
                });
                songTitleEl.textContent = "Feeling better 🎵";
            }
        }
    }, 100));
};



const init = () => {
    // Event Listeners

    resetBtn.onclick = () => {
        location.reload();
    };

    skipBtn.forEach(button => {
        button.addEventListener('click', skipSong);
    });

    pauseBtn.onclick = () => {
        isPaused = !isPaused;
        pauseOverlay.classList.toggle('hidden', !isPaused);
        pauseBtn.classList.toggle('selected', isPaused);

        if (isPaused) {
            // Stop all tracked intervals
            timersPaused.forEach(clearInterval);
            timersPaused = [];

            // Pause song timer
            clearInterval(songTimer);
        } else {
            restartAllTimers();

            // Resume song timer
            songTimer = setInterval(() => {
                songElapsed++;
                const percent = Math.min(100, (songElapsed / songDuration) * 100);
                songProgress.forEach(progressBar => {
                    progressBar.style.width = percent + '%';
                    if (songElapsed >= songDuration) {
                        clearInterval(songTimer);
                        skipSong(); // simulate next song
                    }
                });


            }, 1000);
        }
    };

    autosaveBtn.onclick = () => {
        switch (autosave) {
            case 0:
                autosave = 1;
                autosaveBtn.classList.add('selected');
                break;
            case 1:
                autosave = 0;
                autosaveBtn.classList.remove('selected');
                break;
        }

        console.log(autosave);
    };

    saevBtn.addEventListener('click', saveGame);
    loadBtn.addEventListener('click', loadGame);

    rechargeBtn.addEventListener('click', rechargeBattery);

    document.querySelector('#open-shop').onclick = () => {
        renderShop();
        shopModal.classList.remove('hidden');
    };

    document.querySelector('.modal .close').onclick = () => {
        shopModal.classList.add('hidden');
    };

    restartAllTimers();

}

init();

