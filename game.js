const pronouns = [
    "já", "mě", "mne", "mně", "mi", "my", "nás", "nám", "ty", "tě", "tebe", "tobě", "vy",
    "vás", "vám", "on", "jeho", "ho", "jej", "jemu", "mu", "ona", "ji", "ní", "jí", "ono",
    "oni", "ony", "jejich", "jim", "je", "můj", "moje", "moji", "mí", "mé", "mého", "mému",
    "mým", "mých", "mými", "tvůj", "tvoje", "tvá", "tvoji", "tví", "tvé", "tvého", "tvému",
    "tvým", "tvých", "tvými", "jeho", "její", "jejich", "náš", "naše", "naši", "naší", "našeho",
    "našemu", "naším", "našich", "našimi", "váš", "vaše", "vaši", "vaší", "vašeho", "vašemu",
    "vaším", "vašich", "vašimi", "ten", "ta", "to", "ti", "ty", "tahle", "tohle", "tamten",
    "tamta", "tamto", "tento", "tata", "toto", "takový", "onen", "týž", "tentýž", "tentam"
];

const otherWords = [
    "pes", "kočka", "dům", "strom", "auto", "škola", "učitel", "žák", "stůl", "židle",
    "hora", "řeka", "moře", "kniha", "počítač", "telefon", "lampa", "hodiny", "klíč", "pero"
];

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 10
};

let words = [];
let bullets = [];
let score = 0;
let lives = 5;
let timeElapsed = 0;
let speedMultiplier = 1;

let correctHits = [];
let missedPronouns = [];

let keys = {};

let gameOver = false;
let spawnInterval;
let restartListenerAdded = false;

// Načtení obrázků s error handlery
let rocketImage = new Image();
rocketImage.src = 'rocket.png';
rocketImage.onerror = () => console.error("Nepodařilo se načíst rocket.png");

let ufoImage = new Image();
ufoImage.src = 'ufo.png';
ufoImage.onerror = () => console.error("Nepodařilo se načíst ufo.png");

// Načtení zvuků s error handlery
let correctSound = new Audio('correct.mp3');
correctSound.onerror = () => console.error("Nepodařilo se načíst correct.mp3");

let wrongSound = new Audio('wrong.mp3');
wrongSound.onerror = () => console.error("Nepodařilo se načíst wrong.mp3");

function spawnWord() {
    // Omezení maximálního počtu slov
    if (words.length >= 10) return;

    let isPronoun = Math.random() < 0.5;
    let text = isPronoun
        ? pronouns[Math.floor(Math.random() * pronouns.length)]
        : otherWords[Math.floor(Math.random() * otherWords.length)];
    
    let newWord = {
        text: text,
        x: Math.random() * (canvas.width - 50),
        y: -50,
        speed: 0.5 + Math.random() * 1
    };

    words.push(newWord);
}

function update(deltaTime) {
    if (gameOver) return;

    timeElapsed += deltaTime;
    
    // Zvýšení obtížnosti po 30 sekundách
    if (timeElapsed > 30000) {
        speedMultiplier = 1.5;
    }

    // Pohyb hráče
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }

    // Optimalizovaná aktualizace slov
    words = words.filter(word => {
        word.y += word.speed * speedMultiplier;

        if (word.y > canvas.height) {
            if (pronouns.includes(word.text)) {
                lives--;
                missedPronouns.push(word.text);
                
                try {
                    wrongSound.play().catch(e => console.error("Chyba zvuku:", e));
                } catch (e) {
                    console.error("Chyba při přehrávání zvuku:", e);
                }

                if (lives <= 0) {
                    endGame();
                    return false;
                }
            }
            return false;
        }
        return true;
    });

    // Optimalizovaná kontrola kolizí střel
    bullets = bullets.filter(bullet => {
        bullet.y -= bullet.speed;

        if (bullet.y < 0) return false;

        const hitIndex = words.findIndex(word => 
            bullet.x > word.x &&
            bullet.x < word.x + 50 &&
            bullet.y > word.y &&
            bullet.y < word.y + 50
        );

        if (hitIndex !== -1) {
            const word = words[hitIndex];
            
            if (pronouns.includes(word.text)) {
                score++;
                correctHits.push(word.text);
                
                try {
                    correctSound.play().catch(e => console.error("Chyba zvuku:", e));
                } catch (e) {
                    console.error("Chyba při přehrávání zvuku:", e);
                }

                if (score >= 20) {
                    endGame();
                    return false;
                }
            } else {
                lives--;
                
                try {
                    wrongSound.play().catch(e => console.error("Chyba zvuku:", e));
                } catch (e) {
                    console.error("Chyba při přehrávání zvuku:", e);
                }

                if (lives <= 0) {
                    endGame();
                    return false;
                }
            }
            
            words.splice(hitIndex, 1);
            return false;
        }
        return true;
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Nadpis
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SESTŘEL ZÁJMENA', canvas.width / 2, 30);

    // Hráč
    ctx.drawImage(rocketImage, player.x, player.y, player.width, player.height);

    // Slova
    for (let word of words) {
        ctx.drawImage(ufoImage, word.x, word.y, 50, 50);

        // Nastavení fontu a barvy pro slova
        ctx.fillStyle = 'green';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';

        // Zobrazení slova pod UFO
        ctx.fillText(word.text, word.x + 25, word.y + 70);
    }

    // Reset textAlign na defaultní hodnotu
    ctx.textAlign = 'left';

    // Střely
    ctx.fillStyle = 'red';
    for (let bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, 5, 10);
    }

    // Skóre a životy
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('Skóre: ' + score, 10, 20);
    ctx.fillText('Životy: ' + lives, 10, 40);

    // Obrazovka konce hry
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Hra skončila!', canvas.width / 2, canvas.height / 2 - 120);

        ctx.font = '24px Arial';
        ctx.fillText(
            'Správně sestřelená zájmena:',
            canvas.width / 2,
            canvas.height / 2 - 80
        );
        ctx.fillText(
            correctHits.join(', '),
            canvas.width / 2,
            canvas.height / 2 - 50
        );

        ctx.fillText(
            'Zájmena, která jste nesestřelil:',
            canvas.width / 2,
            canvas.height / 2 - 10
        );
        ctx.fillText(
            missedPronouns.join(', '),
            canvas.width / 2,
            canvas.height / 2 + 20
        );

        // Tlačítko "Hrát znovu"
        ctx.fillStyle = 'yellow';
        ctx.fillRect(
            canvas.width / 2 - 100,
            canvas.height / 2 + 50,
            200,
            50
        );
        ctx.fillStyle = 'black';
        ctx.font = '24px Arial';
        ctx.fillText('Hrát znovu', canvas.width / 2, canvas.height / 2 + 85);

        if (!restartListenerAdded) {
            canvas.addEventListener('click', restartGame);
            restartListenerAdded = true;
        }
    }
}

let lastTimestamp = 0;
let animationId;

function gameLoop(timestamp) {
    // Ochrana proti přetečení času
    const deltaTime = Math.min(timestamp - lastTimestamp, 100);
    lastTimestamp = timestamp;

    update(deltaTime);
    draw();

    if (!gameOver) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function shoot() {
    // Limit počtu střel
    if (bullets.length < 5) {
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            speed: 7
        });
    }
}

function endGame() {
    if (gameOver) return;
    
    gameOver = true;
    cancelAnimationFrame(animationId);
    clearInterval(spawnInterval);
}

function restartGame(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (
        x >= canvas.width / 2 - 100 &&
        x <= canvas.width / 2 + 100 &&
        y >= canvas.height / 2 + 50 &&
        y <= canvas.height / 2 + 100
    ) {
        canvas.removeEventListener('click', restartGame);
        restartListenerAdded = false;
        resetGame();
    }
}

function resetGame() {
    words = [];
    bullets = [];
    score = 0;
    lives = 5;
    timeElapsed = 0;
    speedMultiplier = 1;
    correctHits = [];
    missedPronouns = [];
    gameOver = false;

    spawnInterval = setInterval(spawnWord, 1000);
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
}

// Ovládání klávesnicí
document.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    if (e.key === ' ') {
        shoot();
    }
});
document.addEventListener('keyup', function (e) {
    keys[e.key] = false;
});

// Ovládání tlačítky na obrazovce
document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys['ArrowLeft'] = true;
});
document.getElementById('leftBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    keys['ArrowLeft'] = false;
});
document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys['ArrowRight'] = true;
});
document.getElementById('rightBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    keys['ArrowRight'] = false;
});
document.getElementById('shootBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    shoot();
});

// Spuštění hry po načtení stránky
window.onload = function () {
    spawnInterval = setInterval(spawnWord, 1000);
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
};