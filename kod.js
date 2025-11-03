// Oyun durumu
const gameState = {
    currentMode: 'easy',
    isPlaying: false,
    score: 0,
    lives: 3,
    level: 1,
    targetNumber: 0,
    boxes: [],
    selectedBoxes: [],
    timer: null,
    timeLeft: 0,
    totalTime: 30,
    highScore: localStorage.getItem('numberGameHighScore') || 0
};

// DOM elementleri
const elements = {
    score: document.getElementById('score'),
    lives: document.getElementById('lives'),
    level: document.getElementById('level'),
    targetNumber: document.getElementById('target-number'),
    boxesContainer: document.getElementById('boxes-container'),
    selectedNumbers: document.getElementById('selected-numbers'),
    selectedSum: document.getElementById('selected-sum'),
    message: document.getElementById('message'),
    highScore: document.getElementById('high-score'),
    startBtn: document.getElementById('start-btn'),
    timerBar: document.getElementById('timer-bar'),
    correctSound: document.getElementById('correct-sound'),
    wrongSound: document.getElementById('wrong-sound')
};

// Mod butonları
const modeButtons = {
    easy: document.getElementById('easy'),
    normal: document.getElementById('normal'),
    hard: document.getElementById('hard')
};

// Sayı aralıkları (moda göre)
const numberRanges = {
    easy: { min: 0, max: 10 },
    normal: { min: 0, max: 100 },
    hard: { min: 0, max: 1000 }
};

// Zaman sınırları (moda göre)
const timeLimits = {
    easy: 30,
    normal: 40,
    hard: 50
};

// Puan katsayıları (moda göre)
const scoreMultipliers = {
    easy: 1,
    normal: 2,
    hard: 3
};

// Oyunu başlat
function startGame() {
    if (gameState.isPlaying) return;
    
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    gameState.selectedBoxes = [];
    
    elements.startBtn.textContent = 'Oyun Devam Ediyor';
    elements.startBtn.disabled = true;
    
    updateUI();
    generateNewRound();
    startTimer();
}

// Yeni tur oluştur
function generateNewRound() {
    gameState.selectedBoxes = [];
    gameState.boxes = [];
    
    // Kutuları oluştur
    for (let i = 0; i < 9; i++) {
        const range = numberRanges[gameState.currentMode];
        gameState.boxes.push(
            Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
        );
    }
    
    // Hedef sayıyı belirle (en az bir çözüm olacak şekilde)
    ensureSolvable();
    
    // Kutuları ekrana yerleştir
    renderBoxes();
    updateSelectionInfo();
}

// En az bir çözüm olacak şekilde hedef sayıyı belirle
function ensureSolvable() {
    // Rastgele 3 kutu seç ve toplamlarını hedef yap
    const indices = [];
    while (indices.length < 3) {
        const randomIndex = Math.floor(Math.random() * 9);
        if (!indices.includes(randomIndex)) {
            indices.push(randomIndex);
        }
    }
    
    gameState.targetNumber = indices.reduce((sum, index) => sum + gameState.boxes[index], 0);
    elements.targetNumber.textContent = gameState.targetNumber;
}

// Kutuları ekrana yerleştir
function renderBoxes() {
    elements.boxesContainer.innerHTML = '';
    
    gameState.boxes.forEach((number, index) => {
        const box = document.createElement('div');
        box.className = 'number-box';
        box.textContent = number;
        box.dataset.index = index;
        
        box.addEventListener('click', () => selectBox(index));
        
        elements.boxesContainer.appendChild(box);
    });
}

// Kutu seçimi
function selectBox(index) {
    if (!gameState.isPlaying) return;
    
    const box = elements.boxesContainer.children[index];
    const isSelected = gameState.selectedBoxes.includes(index);
    
    if (isSelected) {
        // Kutu zaten seçili, seçimi kaldır
        gameState.selectedBoxes = gameState.selectedBoxes.filter(i => i !== index);
        box.classList.remove('selected');
    } else {
        // Yeni kutu seç
        if (gameState.selectedBoxes.length < 3) {
            gameState.selectedBoxes.push(index);
            box.classList.add('selected');
        }
    }
    
    updateSelectionInfo();
    
    // 3 kutu seçildiyse kontrol et
    if (gameState.selectedBoxes.length === 3) {
        checkSelection();
    }
}

// Seçim bilgilerini güncelle
function updateSelectionInfo() {
    if (gameState.selectedBoxes.length === 0) {
        elements.selectedNumbers.textContent = '-';
        elements.selectedSum.textContent = '0';
        return;
    }
    
    const selectedNumbers = gameState.selectedBoxes.map(index => gameState.boxes[index]);
    const sum = selectedNumbers.reduce((total, num) => total + num, 0);
    
    elements.selectedNumbers.textContent = selectedNumbers.join(' + ');
    elements.selectedSum.textContent = sum;
}

// Seçimi kontrol et
function checkSelection() {
    const selectedNumbers = gameState.selectedBoxes.map(index => gameState.boxes[index]);
    const sum = selectedNumbers.reduce((total, num) => total + num, 0);
    
    if (sum === gameState.targetNumber) {
        // Doğru tahmin
        handleCorrectGuess();
    } else {
        // Yanlış tahmin
        handleWrongGuess();
    }
}

// Doğru tahmin işlemi
function handleCorrectGuess() {
    // Ses çal
    elements.correctSound.play();
    
    // Puan ekle
    const points = 10 * gameState.level * scoreMultipliers[gameState.currentMode];
    gameState.score += points;
    
    // Seviye atla
    gameState.level++;
    
    // Mesaj göster
    showMessage(`Doğru! +${points} puan`, 'success');
    
    // Doğru kutuları vurgula
    gameState.selectedBoxes.forEach(index => {
        elements.boxesContainer.children[index].classList.add('correct');
    });
    
    // Yeni tur için hazırlan
    setTimeout(() => {
        generateNewRound();
        resetTimer();
    }, 1500);
}

// Yanlış tahmin işlemi
function handleWrongGuess() {
    // Ses çal
    elements.wrongSound.play();
    
    // Can azalt
    gameState.lives--;
    
    // Mesaj göster
    showMessage('Yanlış! Can kaybettiniz.', 'error');
    
    // Yanlış kutuları vurgula
    gameState.selectedBoxes.forEach(index => {
        elements.boxesContainer.children[index].classList.add('wrong');
    });
    
    // Seçimleri sıfırla
    setTimeout(() => {
        gameState.selectedBoxes = [];
        renderBoxes();
        updateSelectionInfo();
        
        // Can kalmadı mı kontrol et
        if (gameState.lives <= 0) {
            endGame();
        }
    }, 1500);
}

// Zamanlayıcıyı başlat
function startTimer() {
    gameState.totalTime = timeLimits[gameState.currentMode];
    gameState.timeLeft = gameState.totalTime;
    updateTimerBar();
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerBar();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            handleTimeUp();
        }
    }, 1000);
}

// Zamanlayıcıyı sıfırla
function resetTimer() {
    clearInterval(gameState.timer);
    startTimer();
}

// Zaman doldu işlemi
function handleTimeUp() {
    gameState.lives--;
    showMessage('Süre doldu! Can kaybettiniz.', 'error');
    
    // Can kalmadı mı kontrol et
    if (gameState.lives <= 0) {
        endGame();
    } else {
        generateNewRound();
        startTimer();
    }
}

// Zaman çubuğunu güncelle
function updateTimerBar() {
    const percentage = (gameState.timeLeft / gameState.totalTime) * 100;
    elements.timerBar.style.width = `${percentage}%`;
    
    // Renk değişimi
    if (percentage < 20) {
        elements.timerBar.style.backgroundColor = '#f44336';
    } else if (percentage < 50) {
        elements.timerBar.style.backgroundColor = '#ff9800';
    } else {
        elements.timerBar.style.backgroundColor = '#4CAF50';
    }
}

// Mesaj göster
function showMessage(text, type) {
    elements.message.textContent = text;
    elements.message.className = `message ${type}`;
    
    // Mesajı 3 saniye sonra temizle
    setTimeout(() => {
        elements.message.textContent = '';
        elements.message.className = 'message';
    }, 3000);
}

// Oyunu bitir
function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.timer);
    
    // Yüksek skoru güncelle
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('numberGameHighScore', gameState.highScore);
        showMessage(`Tebrikler! Yeni rekor: ${gameState.highScore}`, 'success');
    } else {
        showMessage(`Oyun bitti! Skorunuz: ${gameState.score}`, 'error');
    }
    
    elements.startBtn.textContent = 'Tekrar Oyna';
    elements.startBtn.disabled = false;
    
    updateHighScoreDisplay();
}

// UI'ı güncelle
function updateUI() {
    elements.score.textContent = gameState.score;
    elements.lives.textContent = gameState.lives;
    elements.level.textContent = gameState.level;
    updateHighScoreDisplay();
}

// Yüksek skoru göster
function updateHighScoreDisplay() {
    elements.highScore.textContent = `En Yüksek Skor: ${gameState.highScore}`;
}

// Mod değiştirme
function changeMode(mode) {
    if (gameState.isPlaying) {
        showMessage('Oyun devam ederken mod değiştirilemez!', 'error');
        return;
    }
    
    gameState.currentMode = mode;
    
    // Aktif mod butonunu güncelle
    Object.keys(modeButtons).forEach(key => {
        if (key === mode) {
            modeButtons[key].classList.add('active');
        } else {
            modeButtons[key].classList.remove('active');
        }
    });
    
    showMessage(`${getModeName(mode)} modu seçildi.`, 'success');
}

// Mod ismini al
function getModeName(mode) {
    const names = {
        easy: 'Kolay',
        normal: 'Normal',
        hard: 'Zor'
    };
    
    return names[mode];
}

// Olay dinleyicileri
function setupEventListeners() {
    // Mod butonları
    modeButtons.easy.addEventListener('click', () => changeMode('easy'));
    modeButtons.normal.addEventListener('click', () => changeMode('normal'));
    modeButtons.hard.addEventListener('click', () => changeMode('hard'));
    
    // Başlat butonu
    elements.startBtn.addEventListener('click', startGame);
}

// Sayfa yüklendiğinde oyunu hazırla
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateHighScoreDisplay();
    showMessage('Bir mod seçin ve "Oyuna Başla" butonuna tıklayın.', 'success');
});