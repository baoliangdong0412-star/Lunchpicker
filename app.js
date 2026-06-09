const foods = [
  "番茄鸡蛋盖饭",
  "青椒肉丝盖饭",
  "宫保鸡丁盖饭",
  "土豆牛肉盖饭",
  "照烧鸡排饭",
  "炸鸡排饭",
  "卤肉饭",
  "海南鸡饭",
  "黄焖鸡米饭",
  "煲仔饭",
  "粤式烧腊饭",
  "扬州炒饭",
  "蛋炒饭",
  "日式咖喱饭",
  "韩式拌饭",
  "牛肉拉面",
  "番茄鸡蛋面",
  "鸡汤面",
  "云吞面",
  "米线",
  "馄饨",
  "水饺",
  "生煎套餐",
  "汉堡套餐",
  "三明治套餐",
  "寿司套餐",
  "日式定食",
  "轻食沙拉套餐",
  "健身餐",
  "营养粥套餐",
];

const phases = [
  { until: 1150, label: "正在扫描味觉轨道…", core: "扫描候选餐点" },
  { until: 3000, label: "正在混选午餐胶囊…", core: "高速混选中" },
  { until: 4250, label: "正在锁定今日频道…", core: "信号即将锁定" },
  { until: 5000, label: "午餐胶囊正在着陆…", core: "准备接收结果" },
];

const launchButton = document.querySelector("#launchButton");
const machineSection = document.querySelector(".machine-section");
const countdown = document.querySelector("#countdown");
const countdownNumber = document.querySelector("#countdownNumber");
const phaseText = document.querySelector("#phaseText");
const coreLabel = document.querySelector("#coreLabel");
const previewFood = document.querySelector("#previewFood");
const resultTicket = document.querySelector("#resultTicket");
const resultFood = document.querySelector("#resultFood");
const resultNumber = document.querySelector("#resultNumber");
const resultTime = document.querySelector("#resultTime");
const confettiLayer = document.querySelector("#confettiLayer");
const foodDialog = document.querySelector("#foodDialog");
const foodGrid = document.querySelector("#foodGrid");
const listTrigger = document.querySelector("#listTrigger");
const closeDialog = document.querySelector("#closeDialog");
const historyList = document.querySelector("#historyList");
const historyEmpty = document.querySelector("#historyEmpty");
const clearHistory = document.querySelector("#clearHistory");
const buttonSmall = launchButton.querySelector("small");
const buttonStrong = launchButton.querySelector("strong");

let isRunning = false;
let animationFrame = 0;
let shuffleTimer = 0;
let history = readHistory();

function randomIndex(max) {
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    do {
      window.crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % max;
  }

  return Math.floor(Math.random() * max);
}

function populateFoodGrid() {
  const fragment = document.createDocumentFragment();
  foods.forEach((food) => {
    const item = document.createElement("li");
    item.textContent = food;
    fragment.append(item);
  });
  foodGrid.append(fragment);
}

function readHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem("lunch-signal-history") || "[]");
    return Array.isArray(saved) ? saved.slice(0, 3) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem("lunch-signal-history", JSON.stringify(history));
  } catch {
    // The selector still works if storage is unavailable.
  }
}

function renderHistory() {
  historyList.replaceChildren();
  historyEmpty.hidden = history.length > 0;
  clearHistory.hidden = history.length === 0;

  history.forEach((food) => {
    const item = document.createElement("li");
    item.textContent = food;
    historyList.append(item);
  });
}

function getPhase(elapsed) {
  return phases.find((phase) => elapsed < phase.until) || phases.at(-1);
}

function updateProgress(startTime) {
  const elapsed = Math.min(performance.now() - startTime, 5000);
  const remaining = Math.max(0, 5000 - elapsed);
  const phase = getPhase(elapsed);

  countdown.style.setProperty("--progress", `${(elapsed / 5000) * 360}deg`);
  countdownNumber.textContent = Math.max(1, Math.ceil(remaining / 1000));
  phaseText.textContent = phase.label;
  coreLabel.textContent = phase.core;

  if (elapsed < 5000) {
    animationFrame = requestAnimationFrame(() => updateProgress(startTime));
  }
}

function createConfetti() {
  const colors = ["#ee5b43", "#f3c850", "#86aa7a", "#f7f0df", "#d2a7b8"];

  for (let index = 0; index < 38; index += 1) {
    const piece = document.createElement("i");
    const angle = Math.random() * Math.PI * 2;
    const distance = 110 + Math.random() * 260;
    piece.className = "confetti";
    piece.style.background = colors[index % colors.length];
    piece.style.left = `${58 + Math.random() * 22}%`;
    piece.style.top = `${36 + Math.random() * 20}%`;
    piece.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--ty", `${Math.sin(angle) * distance + 120}px`);
    piece.style.setProperty("--rot", `${Math.random() * 900 - 450}deg`);
    piece.style.animationDelay = `${Math.random() * 110}ms`;
    confettiLayer.append(piece);
    piece.addEventListener("animationend", () => piece.remove(), { once: true });
  }
}

function finishLaunch(food, index) {
  clearInterval(shuffleTimer);
  cancelAnimationFrame(animationFrame);

  previewFood.textContent = food;
  coreLabel.textContent = "信号接收成功";
  phaseText.textContent = "传输完成 · 请领取今日午餐";
  countdown.style.setProperty("--progress", "360deg");
  countdownNumber.textContent = "✓";

  resultNumber.textContent = `#${String(index + 1).padStart(2, "0")}`;
  resultFood.textContent = food;
  resultTime.textContent = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  resultTicket.classList.remove("is-new");
  void resultTicket.offsetWidth;
  resultTicket.classList.add("is-new");

  history = [food, ...history.filter((item) => item !== food)].slice(0, 3);
  saveHistory();
  renderHistory();
  createConfetti();

  machineSection.classList.remove("is-running");
  launchButton.disabled = false;
  buttonSmall.textContent = "PRESS TO RELAUNCH";
  buttonStrong.textContent = "再发射一次";
  isRunning = false;
}

function launch() {
  if (isRunning) return;
  isRunning = true;

  const resultIndex = randomIndex(foods.length);
  const selectedFood = foods[resultIndex];
  const startTime = performance.now();
  let lastPreview = -1;

  launchButton.disabled = true;
  machineSection.classList.add("is-running");
  resultTicket.classList.remove("is-new");
  buttonSmall.textContent = "SIGNAL TRANSMITTING";
  buttonStrong.textContent = "正在接收…";
  countdownNumber.textContent = "5";
  countdown.style.setProperty("--progress", "0deg");

  updateProgress(startTime);

  shuffleTimer = window.setInterval(() => {
    let previewIndex = randomIndex(foods.length);
    if (previewIndex === lastPreview) {
      previewIndex = (previewIndex + 1) % foods.length;
    }
    lastPreview = previewIndex;
    previewFood.textContent = foods[previewIndex];
  }, 92);

  window.setTimeout(() => finishLaunch(selectedFood, resultIndex), 5000);
}

launchButton.addEventListener("click", launch);

listTrigger.addEventListener("click", () => {
  foodDialog.showModal();
});

closeDialog.addEventListener("click", () => {
  foodDialog.close();
});

foodDialog.addEventListener("click", (event) => {
  if (event.target === foodDialog) {
    foodDialog.close();
  }
});

clearHistory.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});

populateFoodGrid();
renderHistory();
