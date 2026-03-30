let currentVolume = 0;
let decayRate = 0.98; // 2% decay every second

function setVolume() {
  const mathInput = document.getElementById("mathInput").value;
  const x = parseFloat(document.getElementById("xValue").value);
  let result;

  try {
    const func = new Function("x", `return ${mathInput}`);
    result = func(x);
    if (typeof result !== "number" || isNaN(result)) throw "Invalid math";
  } catch (err) {
    alert("Invalid math expression");
    return;
  }

  currentVolume = Math.max(0, Math.min(100, result));
  updateDisplay();
}

function updateDisplay() {
  const vol = currentVolume.toFixed(2);
  document.getElementById("volumeDisplay").innerText = `Volume: ${vol}%`;
}

function decayLoop() {
  currentVolume *= decayRate;
  updateDisplay();
  requestAnimationFrame(() => setTimeout(decayLoop, 1000));
}

// Start decaying on page load
decayLoop();
