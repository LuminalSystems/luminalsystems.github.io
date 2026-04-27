const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const game = {
  width: canvas.width,
  height: canvas.height,
  centerX: canvas.width / 2,
  centerY: canvas.height / 2,
  arenaRadius: 220,

  spawn: {
    x: canvas.width / 2,
    y: 120
  },

  aim: {
    angle: Math.PI / 2,
    coneMin: Math.PI / 2 - 0.6,
    coneMax: Math.PI / 2 + 0.6,
    length: 90
  },

  mouse: {
    x: canvas.width / 2,
    y: canvas.height / 2
  },

  killSegments: [
  { start: 2.2, end: 3.9 } // a large deadly arc on left/lower side
  ],

  currentBall: null,
  deadBalls: [],
  ballRadius: 8,
  launchSpeed: 5
};

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = e.clientX - rect.left;
  game.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("click", () => {
  launchBall();
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateAimAngle() {
  const dx = game.mouse.x - game.spawn.x;
  const dy = game.mouse.y - game.spawn.y;
  const rawAngle = Math.atan2(dy, dx);
  game.aim.angle = clamp(rawAngle, game.aim.coneMin, game.aim.coneMax);
}

function launchBall() {
  if (game.currentBall) return;

  game.currentBall = {
    x: game.spawn.x,
    y: game.spawn.y,
    vx: Math.cos(game.aim.angle) * game.launchSpeed,
    vy: Math.sin(game.aim.angle) * game.launchSpeed,
    radius: game.ballRadius,
    alive: true
  };
}

function normalizeAngle(angle) {
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}

function angleInRange(angle, start, end) {
  angle = normalizeAngle(angle);
  start = normalizeAngle(start);
  end = normalizeAngle(end);

  if (start <= end) {
    return angle >= start && angle <= end;
  }

  // wrapped range
  return angle >= start || angle <= end;
}

function isKillAngle(angle) {
  return game.killSegments.some(segment =>
    angleInRange(angle, segment.start, segment.end)
  );
}


function updateBall() {
  if (!game.currentBall) return;

  const ball = game.currentBall;

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // --- Collision with dead balls ---
  for (const deadBall of game.deadBalls) {
    const dx = ball.x - deadBall.x;
    const dy = ball.y - deadBall.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = ball.radius + deadBall.radius;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;

      // Push live ball out so it doesn't overlap/stick
      const overlap = minDist - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      // Reflect velocity across collision normal
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx = ball.vx - 2 * dot * nx;
      ball.vy = ball.vy - 2 * dot * ny;

      // Stop processing more dead-ball collisions this frame
      break;
    }
  }

  // --- Collision with arena wall ---
  const dx = ball.x - game.centerX;
  const dy = ball.y - game.centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist + ball.radius >= game.arenaRadius) {
    const angle = Math.atan2(dy, dx);

    // Death on red segment
    if (isKillAngle(angle)) {
      const nx = dx / dist;
      const ny = dy / dist;

      const snapDist = game.arenaRadius - ball.radius;
      const deathX = game.centerX + nx * snapDist;
      const deathY = game.centerY + ny * snapDist;

      game.deadBalls.push({
        x: deathX,
        y: deathY,
        radius: ball.radius
      });

      game.currentBall = null;
      return;
    }

    // Normal bounce on safe wall
    const nx = dx / dist;
    const ny = dy / dist;

    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx = ball.vx - 2 * dot * nx;
    ball.vy = ball.vy - 2 * dot * ny;

    const overlap = (dist + ball.radius) - game.arenaRadius;
    ball.x -= nx * overlap;
    ball.y -= ny * overlap;
  }
}

function drawDeadBalls() {
  for (const deadBall of game.deadBalls) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(deadBall.x, deadBall.y, deadBall.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#888888";
    ctx.fill();
    ctx.restore();
  }
}

function clearScreen() {
  ctx.clearRect(0, 0, game.width, game.height);
}

function drawArena() {
  ctx.save();

  // Base arena ring
  ctx.beginPath();
  ctx.arc(game.centerX, game.centerY, game.arenaRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "#19d3ff";
  ctx.lineWidth = 5;
  ctx.stroke();

  // Draw deadly segments
  for (const segment of game.killSegments) {
    ctx.beginPath();
    ctx.arc(
      game.centerX,
      game.centerY,
      game.arenaRadius,
      segment.start,
      segment.end
    );
    ctx.strokeStyle = "#ff3355";
    ctx.lineWidth = 8;
    ctx.stroke();
  }

  ctx.restore();
}

function drawExitGap() {
  const gapStart = 1.05;
  const gapEnd = 1.35;

  ctx.save();
  ctx.beginPath();
  ctx.arc(game.centerX, game.centerY, game.arenaRadius, gapStart, gapEnd);
  ctx.strokeStyle = "#050510";
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.restore();
}

function drawSpawnPoint() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(game.spawn.x, game.spawn.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
}

function drawAimCone() {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;

  for (const angle of [game.aim.coneMin, game.aim.coneMax]) {
    const x = game.spawn.x + Math.cos(angle) * 110;
    const y = game.spawn.y + Math.sin(angle) * 110;

    ctx.beginPath();
    ctx.moveTo(game.spawn.x, game.spawn.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAimLine() {
  if (game.currentBall) return;

  const x = game.spawn.x + Math.cos(game.aim.angle) * game.aim.length;
  const y = game.spawn.y + Math.sin(game.aim.angle) * game.aim.length;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(game.spawn.x, game.spawn.y);
  ctx.lineTo(x, y);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawBall() {
  if (!game.currentBall) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(game.currentBall.x, game.currentBall.y, game.currentBall.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#2d6bff";
  ctx.fill();
  ctx.restore();
}

function drawHUD() {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "18px Arial";
  ctx.fillText("Musical Death Notes", 20, 30);
  ctx.fillText("Phase 2: Launch Ball", 20, 55);

  if (!game.currentBall) {
    ctx.fillText("Click to launch", 20, 85);
  }

  ctx.restore();
}

function render() {
  clearScreen();
  drawArena();
  drawExitGap();
  drawSpawnPoint();
  drawAimCone();
  drawAimLine();
  drawDeadBalls();
  drawBall();
  drawHUD();
}

function loop() {
  updateAimAngle();
  updateBall();
  render();
  requestAnimationFrame(loop);
}

loop();