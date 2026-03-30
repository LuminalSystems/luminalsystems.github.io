const canvas = document.getElementById('rain-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drops = [];
let volumeOn = new Set();
let weatherSpeedMultiplier = 1; // Simulate weather effect

const totalDrops = 100;
const dropVolume = 100 / totalDrops;
let currentVolume = 100;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

// Simulated weather condition (mocked logic)
const weatherConditions = ['clear', 'rain', 'wind', 'tornado', 'blizzard', 'earthquake', 'volcano'];
const currentCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

switch (currentCondition) {
  case 'clear':
    weatherSpeedMultiplier = 0.4;
    break;
  case 'rain':
    weatherSpeedMultiplier = 1;
    break;
  case 'wind':
    weatherSpeedMultiplier = 1.5;
    break;
  case 'tornado':
    weatherSpeedMultiplier = 2;
    break;
  case 'blizzard':
    weatherSpeedMultiplier = 1.3;
    break;
  case 'earthquake':
    weatherSpeedMultiplier = 0.6;
    break;
  case 'volcano':
    weatherSpeedMultiplier = 2.5;
    break;
}

for (let i = 0; i < totalDrops; i++) {
  drops.push({
    x: random(0, canvas.width),
    y: random(0, canvas.height),
    speedY: random(2, 5) * weatherSpeedMultiplier,
    active: true
  });
}

function drawDrops() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'aqua';
  drops.forEach((drop, index) => {
    if (drop.active) {
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    switch (currentCondition) {
      case 'blizzard':
        drop.x += Math.sin(Date.now() / 100 + index) * 1.5;
        break;
      case 'tornado':
        drop.x += Math.sin(Date.now() / 200 + index) * 5;
        drop.y += Math.cos(Date.now() / 100 + index) * 2;
        break;
      case 'volcano':
        drop.y -= drop.speedY;
        if (drop.y < 0) drop.y = canvas.height;
        return;
    }

    drop.y += drop.speedY;
    if (drop.y > canvas.height) {
      drop.y = 0;
      drop.x = random(0, canvas.width);
    }
  });

  requestAnimationFrame(drawDrops);
}

canvas.addEventListener('click', (e) => {
  drops.forEach((drop, index) => {
    const dx = e.clientX - drop.x;
    const dy = e.clientY - drop.y;
    if (Math.sqrt(dx * dx + dy * dy) < 10) {
      drop.active = !drop.active;
      if (drop.active) {
        volumeOn.add(index);
      } else {
        volumeOn.delete(index);
      }
    }
  });

  currentVolume = Math.round(volumeOn.size * dropVolume);
  document.getElementById('volume-level').innerText = `${currentVolume}%`;
});

drawDrops();
