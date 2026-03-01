const startBtn = document.getElementById('start-btn');
const targetCircle = document.getElementById('target-circle');
const resultDisplay = document.getElementById('result');
const historyList = document.getElementById('history-list');
const instructionText = document.getElementById('instruction-text');
const bottomUi = document.getElementById('bottom-ui');

const hamburgerBtn = document.getElementById('hamburger-btn');
const settingsContainer = document.getElementById('settings-container');

const visualModeBtn = document.getElementById('visual-mode-btn');
const audioModeBtn = document.getElementById('audio-mode-btn');

const sizeSlider = document.getElementById('size-slider');
const sizeLabel = document.getElementById('size-label');
const rSlider = document.getElementById('r-slider');
const gSlider = document.getElementById('g-slider');
const bSlider = document.getElementById('b-slider');
const rLabel = document.getElementById('r-label');
const gLabel = document.getElementById('g-label');
const bLabel = document.getElementById('b-label');
const colorPreview = document.getElementById('color-preview');

const bgRSlider = document.getElementById('bg-r-slider');
const bgGSlider = document.getElementById('bg-g-slider');
const bgBSlider = document.getElementById('bg-b-slider');
const bgRLabel = document.getElementById('bg-r-label');
const bgGLabel = document.getElementById('bg-g-label');
const bgBLabel = document.getElementById('bg-b-label');
const bgColorPreview = document.getElementById('bg-color-preview');

const MAX_TRIALS = 5;
let trialCount = 0;
let reactionTimes = [];
let startTime = 0;
let timeoutId = null;
let currentState = 'IDLE';
let currentMode = 'VISUAL';

let audioCtx;
let cueOscillator = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playCueSound() {
    if (!audioCtx) return;
    cueOscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    cueOscillator.type = 'sine';
    cueOscillator.frequency.setValueAtTime(880, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    cueOscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    cueOscillator.start();
}

function stopCueSound() {
    if (cueOscillator) {
        cueOscillator.stop();
        cueOscillator.disconnect();
        cueOscillator = null;
    }
}

function playErrorSound() {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.025, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

visualModeBtn.addEventListener('click', () => setMode('VISUAL'));
audioModeBtn.addEventListener('click', () => setMode('AUDIO'));

function setMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    visualModeBtn.classList.toggle('active', mode === 'VISUAL');
    audioModeBtn.classList.toggle('active', mode === 'AUDIO');

    bottomUi.style.display = 'block';

    if (mode === 'VISUAL') {
        instructionText.textContent = '円が出たら画面をクリック';
    } else {
        instructionText.textContent = '音が鳴ったら画面をクリック';
    }

    clearTimeout(timeoutId);
    stopCueSound();
    currentState = 'IDLE';
    trialCount = 0;
    reactionTimes = [];
    startBtn.style.display = 'inline-block';
    resultDisplay.style.display = 'none';
    targetCircle.style.display = 'none';
    historyList.innerHTML = '';
}

startBtn.addEventListener('click', startGame);
document.addEventListener('pointerdown', handleScreenTap);

hamburgerBtn.addEventListener('click', () => {
    settingsContainer.classList.toggle('open');
    if (settingsContainer.classList.contains('open')) {
        hamburgerBtn.textContent = '×';
        hamburgerBtn.style.transform = 'rotate(90deg)';
    } else {
        hamburgerBtn.textContent = '☰';
        hamburgerBtn.style.transform = 'rotate(0deg)';
    }
});

[sizeSlider, rSlider, gSlider, bSlider, bgRSlider, bgGSlider, bgBSlider].forEach(slider => {
    slider.addEventListener('input', updateSettings);
});

function updateSettings() {
    const size = sizeSlider.value;
    sizeLabel.textContent = size;
    targetCircle.style.width = `${size}vmin`;
    targetCircle.style.height = `${size}vmin`;

    const r = rSlider.value; const g = gSlider.value; const b = bSlider.value;
    rLabel.textContent = r; gLabel.textContent = g; bLabel.textContent = b;
    const newColor = `rgb(${r}, ${g}, ${b})`;
    colorPreview.style.backgroundColor = newColor;
    targetCircle.style.backgroundColor = newColor;

    const bgR = bgRSlider.value; const bgG = bgGSlider.value; const bgB = bgBSlider.value;
    bgRLabel.textContent = bgR; bgGLabel.textContent = bgG; bgBLabel.textContent = bgB;
    const newBgColor = `rgb(${bgR}, ${bgG}, ${bgB})`;
    bgColorPreview.style.backgroundColor = newBgColor;
    document.body.style.backgroundColor = newBgColor;
}

function startGame() {
    initAudio();

    trialCount = 0;
    reactionTimes = [];
    startBtn.style.display = 'none';
    resultDisplay.style.display = 'none';
    targetCircle.style.display = 'none';

    bottomUi.style.display = 'none';

    settingsContainer.classList.remove('open');
    hamburgerBtn.textContent = '☰';
    hamburgerBtn.style.transform = 'rotate(0deg)';

    historyList.innerHTML = '';
    for (let i = 1; i <= MAX_TRIALS; i++) {
        historyList.innerHTML += `<li id="trial-${i}">${i}回目: --- ms</li>`;
    }

    nextTrial();
}

function nextTrial() {
    if (trialCount >= MAX_TRIALS) {
        showResult();
        return;
    }
    startCountdown();
}

function startCountdown() {
    currentState = 'WAITING';
    const randomDelay = Math.floor(Math.random() * 4000) + 3000;

    if (currentMode === 'VISUAL') {
        timeoutId = setTimeout(showCircle, randomDelay);
    } else {
        timeoutId = setTimeout(playCue, randomDelay);
    }
}

function showCircle() {
    if (currentState !== 'WAITING') return;
    currentState = 'REACTING';
    targetCircle.style.display = 'block';
    startTime = performance.now();
}

function playCue() {
    if (currentState !== 'WAITING') return;
    currentState = 'REACTING';
    playCueSound();
    startTime = performance.now();
}

function handleScreenTap(e) {
    initAudio();

    if (e.target.id === 'start-btn' ||
        e.target.closest('#settings-container') ||
        e.target.id === 'hamburger-btn' ||
        e.target.closest('#mode-switch')) {
        return;
    }

    if (currentState === 'WAITING') {
        clearTimeout(timeoutId);
        currentState = 'IDLE';

        playErrorSound();
        document.body.classList.add('flash-error');

        setTimeout(() => {
            document.body.classList.remove('flash-error');
            if (trialCount < MAX_TRIALS) {
                setTimeout(startCountdown, 200);
            }
        }, 80);

    } else if (currentState === 'REACTING') {
        stopCueSound();

        const endTime = performance.now();
        const reactionTime = Math.round(endTime - startTime);
        reactionTimes.push(reactionTime);

        if (currentMode === 'VISUAL') {
            targetCircle.style.display = 'none';
        }

        currentState = 'IDLE';

        const listItem = document.getElementById(`trial-${trialCount + 1}`);
        if (listItem) {
            listItem.textContent = `${trialCount + 1}回目: ${reactionTime} ms`;
        }

        trialCount++;
        setTimeout(nextTrial, 500);
    }
}

function showResult() {
    currentState = 'IDLE';
    targetCircle.style.display = 'none';
    stopCueSound();

    bottomUi.style.display = 'block';

    const sum = reactionTimes.reduce((a, b) => a + b, 0);
    const average = sum / MAX_TRIALS;

    resultDisplay.innerHTML = `平均反応速度<br><span class="score">${Math.round(average)}</span> ms`;
    resultDisplay.style.display = 'block';

    startBtn.textContent = 'もう一度プレイ';
    startBtn.style.display = 'inline-block';
}
