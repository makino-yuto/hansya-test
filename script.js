const startBtn = document.getElementById('start-btn');
const targetCircle = document.getElementById('target-circle');
const message = document.getElementById('message');
const resultDisplay = document.getElementById('result');
const historyList = document.getElementById('history-list');

const MAX_TRIALS = 5;
let trialCount = 0;
let reactionTimes = [];
let startTime = 0;
let timeoutId = null;

let currentState = 'IDLE';

startBtn.addEventListener('click', startGame);

document.addEventListener('pointerdown', handleScreenTap);

function startGame() {
    trialCount = 0;
    reactionTimes = [];
    startBtn.style.display = 'none';
    resultDisplay.style.display = 'none';

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
    message.classList.remove('warning');
    message.textContent = `第 ${trialCount + 1} 回 / 全 ${MAX_TRIALS} 回 : 準備...`;

    const randomDelay = Math.floor(Math.random() * 4000) + 3000;
    timeoutId = setTimeout(showCircle, randomDelay);
}

function showCircle() {
    if (currentState !== 'WAITING') return;

    currentState = 'REACTING';
    message.textContent = '今だ！！';
    targetCircle.style.display = 'block';
    startTime = performance.now();
}

function handleScreenTap(e) {
    if (e.target.id === 'start-btn') return;

    if (currentState === 'WAITING') {
        clearTimeout(timeoutId);
        currentState = 'IDLE';

        message.classList.add('warning');
        message.textContent = '早すぎます！もう一度...';

        setTimeout(() => {
            if (trialCount < MAX_TRIALS) {
                startCountdown();
            }
        }, 1500);

    } else if (currentState === 'REACTING') {
        const endTime = performance.now();
        const reactionTime = Math.round(endTime - startTime);
        reactionTimes.push(reactionTime);

        targetCircle.style.display = 'none';
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

    const sum = reactionTimes.reduce((a, b) => a + b, 0);
    const average = sum / MAX_TRIALS;

    message.classList.remove('warning');
    message.innerHTML = 'テスト完了！<br>あなたの平均反応速度は...';
    resultDisplay.innerHTML = `<span class="score">${Math.round(average)}</span> ミリ秒`;
    resultDisplay.style.display = 'block';

    startBtn.textContent = 'もう一度プレイ';
    startBtn.style.display = 'inline-block';
}
