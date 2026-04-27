// fractalLibrary.js

/***
 * 
 * @author Matt D. M. 
 * @copyright (c) Luminal Systems 2025
 * @description A Library of fractals that can be used on the
 * canvas playground or imported via API. 
 * @license CC-NC-BY 4.0 ; You are free to use this library how you see fit, with 
 * the only exceptions being that you CAN NOT claim this as your own work, nor can 
 * you use it to generate profit. Knowledge is meant to be free and accessible to everyone. 
 * Not gate kept or locked behind paywalls or used to generate income just to hoard away. 
 * 
 * If you intend to use this library, please accredit Luminal Systems, Link back, and for 
 * the love of everything, please do not attempt to generate profit with it. Knowledge is free. 
 * Knowledge is for everyone. Knowledge is what lets people grow. 
 * 
 */

/*** 
 * 
 * This is a globalized function for centering
 * all fractals to the center of the canvas. 
 * And then restoring the canvas back to it's original state. 
 * 
 * Further, all fractals are labeled as "Export function" so
 * that they can be imported and used in another script as opposed 
 * to writing all the logic to a singular file with no modulation 
 * This is meant to be a Library that can be imported later. 
 * 
 * TO DO : Turn into API compatible library for other users to play with
 * TO DO : Create function for dynamic / JSON configurable fractals. 
 * TO DO : Create new functions for future ideas like saveMyFractal() and buildFractal()
 *  
 */
function centerCanvas(ctx) {
  ctx.save();
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
}

function restoreCanvas(ctx) {
  ctx.restore();
}

/*** 
 * 
 * This is the logic for drawing the Sierpinski Triangle 
 * This is a well known fractal first derived by Sierpinski, 
 * Hence the name. I did not create this. 
 * 
 ***/
export function drawSierpinskiTriangle(ctx, depth) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  const size = 600;
  const height = size * Math.sqrt(3) / 2;

  const p1 = { x: -size / 2, y: height / 2 };
  const p2 = { x: size / 2, y: height / 2 };
  const p3 = { x: 0, y: -height / 2 };

  ctx.beginPath();
  ctx.strokeStyle = "#00ffff";
  drawTriangleRecursive(ctx, p1, p2, p3, depth);
  ctx.stroke();

  restoreCanvas(ctx);
}

function drawTriangleRecursive(ctx, p1, p2, p3, depth) {
  if (depth === 0) {
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p1.x, p1.y);
    return;
  }

  const mid12 = midpoint(p1, p2);
  const mid23 = midpoint(p2, p3);
  const mid31 = midpoint(p3, p1);

  drawTriangleRecursive(ctx, p1, mid12, mid31, depth - 1);
  drawTriangleRecursive(ctx, mid12, p2, mid23, depth - 1);
  drawTriangleRecursive(ctx, mid31, mid23, p3, depth - 1);
}

function midpoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}


/***
 * 
 * This is the logic for drawing the fractal Sierpinski Carpet 
 * Much like the above fractal, I again, did NOT create this. It 
 * Belongs to Sierpinski and his works. 
 * 
 ***/
export function drawSierpinskiCarpet(ctx, depth, x = -243, y = -243, size = 486) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  ctx.beginPath();
  ctx.fillStyle = "aqua";
  drawCarpet(ctx, x, y, size, depth);
  ctx.fill();

  restoreCanvas(ctx);
}

function drawCarpet(ctx, x, y, size, depth) {
  if (depth === 0) {
    ctx.fillRect(x, y, size, size);
  } else {
    const newSize = size / 3;
    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        if (dx === 1 && dy === 1) continue;
        drawCarpet(ctx, x + dx * newSize, y + dy * newSize, newSize, depth - 1);
      }
    }
  }
}

/***
 * 
 * This is the fractal logic for drawing the Koch Snowflake
 * Like the above 2 fractals, I did not create this either. It 
 * was named after the person who DID make it, Koch. Because 
 * it looks like a snow flake when drawn, it's called the Koch Snowflake.
 * 
 ***/
export function drawKochSnowflake(ctx, depth) {
  if (depth < 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  const size = 300;
  const height = size * Math.sqrt(3) / 2;
  const x = -size / 2;
  const y = height / 2;

  ctx.strokeStyle = "#00ffff";
  drawKochLine(ctx, x, y, x + size, y, depth);
  drawKochLine(ctx, x + size, y, x + size / 2, y - height, depth);
  drawKochLine(ctx, x + size / 2, y - height, x, y, depth);

  restoreCanvas(ctx);
}

function drawKochLine(ctx, x1, y1, x2, y2, depth) {
  if (depth === 0) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const xA = x1 + dx / 3;
  const yA = y1 + dy / 3;
  const xB = x1 + dx * 2 / 3;
  const yB = y1 + dy * 2 / 3;

  const angle = Math.PI / 3;
  const xC = xA + Math.cos(angle) * (dx / 3) - Math.sin(angle) * (dy / 3);
  const yC = yA + Math.sin(angle) * (dx / 3) + Math.cos(angle) * (dy / 3);

  drawKochLine(ctx, x1, y1, xA, yA, depth - 1);
  drawKochLine(ctx, xA, yA, xC, yC, depth - 1);
  drawKochLine(ctx, xC, yC, xB, yB, depth - 1);
  drawKochLine(ctx, xB, yB, x2, y2, depth - 1);
}


/***
 * 
 * This is the logic for drawing the Dragon Curve fractal. 
 * I did not create this fractal either. This particular fractal 
 * however was achieved using L/R instructions. And, pattern seeking
 * minds will realize that this fractal doubles in size each time 
 * and even starts to resemble a logarithmic spiral that closely resembles Phi. (Golden Ratio)
 * 
 ***/
export function drawDragonCurve(ctx, depth) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  const instructions = generateDragonInstructions(depth);
  const startX = -200;
  const startY = 0;
  const step = 10;

  ctx.beginPath();
  ctx.moveTo(startX, startY);

  let x = startX;
  let y = startY;
  let angle = 0;

  for (const turn of instructions) {
    angle += turn === "L" ? -Math.PI / 2 : Math.PI / 2;
    x += Math.cos(angle) * step;
    y += Math.sin(angle) * step;
    ctx.lineTo(x, y);
  }

  ctx.strokeStyle = "#00FFFF";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 5;
  ctx.stroke();

  restoreCanvas(ctx);
}

function generateDragonInstructions(depth) {
  if (depth === 0) return [];
  let seq = ["R"];
  for (let i = 1; i < depth; i++) {
    const copy = [...seq].reverse();
    const flipped = copy.map(turn => (turn === "R" ? "L" : "R"));
    seq.push("R", ...flipped);
  }
  return seq;
}


/***
 * 
 * This is the logic to draw the Tree fractal. This is again, not a 
 * fractal I myself created. The function literally draws a line that 
 * then branches an off set of 45 degrees. After enough iterations. It 
 * begins to look like an actual tree. 
 * 
 ***/
export function drawTree(ctx, depth = 5, length = 120, angle = -Math.PI / 2, x = 0, y = 0) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  drawTreeRecursive(ctx, x, y, length, angle, depth);

  restoreCanvas(ctx);
}

function drawTreeRecursive(ctx, x, y, length, angle, depth) {
  const x2 = x + length * Math.cos(angle);
  const y2 = y + length * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
  ctx.lineWidth = depth;
  ctx.stroke();

  if (depth > 1) {
    drawTreeRecursive(ctx, x2, y2, length * 0.7, angle - Math.PI / 4, depth - 1);
    drawTreeRecursive(ctx, x2, y2, length * 0.7, angle + Math.PI / 4, depth - 1);
  }
}


/***
 * 
 * This is the logic to draw the H-Tree fractal. Again, this is not 
 * a fractal I myself created. The underlying logic is the exact same 
 * as the tree fractal above. The only difference is that instead of 45 
 * degree offsets, you give it 90 degree angles. Which gives a sort of H shape. 
 * 
 ***/
export function drawHTree(ctx, depth = 5, x = 0, y = 0, length = 150) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  drawHTreeRecursive(ctx, x, y, length, depth);

  restoreCanvas(ctx);
}

function drawHTreeRecursive(ctx, x, y, length, depth) {
  if (depth <= 0) return;

  const x0 = x - length / 2;
  const x1 = x + length / 2;
  const y0 = y - length / 2;
  const y1 = y + length / 2;

  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y1);
  ctx.moveTo(x1, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = `rgba(173, 216, 230, 0.8)`;
  ctx.stroke();

  const nextLen = length / Math.sqrt(2);
  drawHTreeRecursive(ctx, x0, y0, nextLen, depth - 1);
  drawHTreeRecursive(ctx, x0, y1, nextLen, depth - 1);
  drawHTreeRecursive(ctx, x1, y0, nextLen, depth - 1);
  drawHTreeRecursive(ctx, x1, y1, nextLen, depth - 1);
}


/***
 * 
 * This is the logic to draw the Cross-X fractal 
 * using H-Tree as it's base. This IS a fractal I created. 
 * Using H-Tree as a base, I replicated it to all 4 cardinal 
 * directions which then gives it a "X" shape. While the underlying 
 * fractal base is the original H-Tree fractal, it is because I duplicated
 * it's logic to all 4 cardinals directions that I claim this as a fractal 
 * I discovered. 
 * 
 ***/
export function drawCrossX(ctx, depth) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  const length = 200;
  drawCrossXBranch(ctx, 0, 0, length, depth);

  restoreCanvas(ctx);
}

function drawCrossXBranch(ctx, x, y, length, depth) {
  if (depth <= 0 || length < 2) return;

  const directions = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ];

  for (let [dx, dy] of directions) {
    const newX = x + dx * length;
    const newY = y + dy * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(newX, newY);
    ctx.strokeStyle = `hsl(${depth * 40}, 100%, 70%)`;
    ctx.lineWidth = Math.max(1, depth / 2);
    ctx.shadowColor = `hsl(${depth * 40}, 100%, 60%)`;
    ctx.shadowBlur = 6;
    ctx.stroke();

    drawCrossXBranch(ctx, newX, newY, length * 0.5, depth - 1);
  }
}

/***
 * 
 * This is the logic to draw the Flower Fractal which 
 * is nothing more than Tree replicated to all 4 cardinal directions. 
 * Again, even though the underlying base fractal is the "Tree" Fractal, 
 * it is because I duplicated the original logic to all 4 cardinal directions
 * to create a flower structure, that I have claimed this as my own discovery. 
 * 
 ***/
export function drawFlowerFractal(ctx, depth) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  angles.forEach(angle => {
    drawTreeRecursive(ctx, 0, 0, 120, angle, depth);
  });

  restoreCanvas(ctx);
}


/***
 * 
 * This is the fractal logic for the Starflake Fractal which 
 * Uses the Tree/H-Tree fractals as it's base pushed in all 
 * 8 cardinal directions. Tbh, this was actually a happy accident. 
 * It was discovered through sheer accident while trying to 
 * Recreate a different fractal. Lol. However, because this is an 
 * original fractal with no other like it, I have claimed this as 
 * my own original fractal using the MIP (Myers Interlock Principle)
 * metholodgy. 
 * 
***/
export function drawStarFlake(ctx, depth) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  function drawSFBranch(x, y, length, angle, depth) {
    if (depth === 0) return;

    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `hsl(${depth * 40}, 100%, 70%)`;
    ctx.lineWidth = Math.max(1, depth / 2);
    ctx.shadowColor = `hsl(${depth * 40}, 100%, 60%)`;
    ctx.shadowBlur = 8;
    ctx.stroke();

    const newLength = length * 0.7;
    drawSFBranch(endX, endY, newLength, angle + Math.PI / 4, depth - 1);
    drawSFBranch(endX, endY, newLength, angle - Math.PI / 4, depth - 1);
  }

  function drawSFBranchNew(x, y, length, angle, depth) {
    if (depth === 0) return;

    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `hsl(${depth * 40}, 100%, 70%)`;
    ctx.lineWidth = Math.max(1, depth / 2);
    ctx.shadowColor = `hsl(${depth * 40}, 100%, 60%)`;
    ctx.shadowBlur = 8;
    ctx.stroke();

    const newLength = length * 0.7;
    drawSFBranchNew(endX, endY, newLength, angle + Math.PI / 2, depth - 1);
    drawSFBranchNew(endX, endY, newLength, angle - Math.PI / 2, depth - 1);
  }

  const angles = [
    0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
    Math.PI, (-3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4
  ];

  const baseLength = 60;
  angles.forEach(angle => {
    drawSFBranch(0, 0, baseLength, angle, depth);
    drawSFBranchNew(0, 0, baseLength, angle, depth);
  });

  restoreCanvas(ctx);
}


/***
 * 
 * This is the fractal logic for the Lotuss Fractal which 
 * Uses the Tree/H-Tree fractals as it's base. As it happens
 * This too is also a happy accident lol.  However, while 
 * similar to the above StarFlake fractal, it IS different in 
 * how I approach the cardinal directional pushes. Using MIP methods, 
 * I again, claim this as my own original fractal. 
 * 
***/
export function drawLotusFractal(ctx, depth) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  function drawLFBranch(x, y, length, angle, depth) {
    if (depth === 0) return;

    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `hsl(${depth * 40}, 100%, 70%)`;
    ctx.lineWidth = Math.max(1, depth / 2);
    ctx.shadowColor = `hsl(${depth * 40}, 100%, 60%)`;
    ctx.shadowBlur = 8;
    ctx.stroke();

    const newLength = length * 0.7;
    const delta = Math.PI / 4;

    drawLFBranch(endX, endY, newLength, angle, depth - 1);
    drawLFBranch(endX, endY, newLength, angle + delta, depth - 1);
    drawLFBranch(endX, endY, newLength, angle - delta, depth - 1);
  }

  const angles = [
    0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
    Math.PI, (-3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4
  ];

  const baseLength = 50;
  angles.forEach(angle => {
    drawLFBranch(0, 0, baseLength, angle, depth);
  });

  restoreCanvas(ctx);
}


/***
 * 
 * This is the fractal logic for the Sunburst Fractal which 
 * Uses the Tree/H-Tree fractals as it's base. It is pushed in 
 * all 8 cardinal directions at once using slightly different 
 * math than the previous two, which allows for it's own 
 * distinction of a fractal. I have claimed this too as my own original 
 * fractal, again, using MIP methods. Note: It's called sunburst due
 * to the fact it very very closely resembles a sun, white spots included, 
 * after only 5 iterations/depth. 
 * 
***/
export function drawSunburst(ctx, depth) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  function drawSBBranch(x, y, length, angle, depth) {
    if (depth <= 0) return;

    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `hsl(${(depth * 40) % 360}, 100%, 70%)`;
    ctx.lineWidth = Math.max(1, depth / 2);
    ctx.shadowColor = `hsl(${(depth * 40) % 360}, 100%, 60%)`;
    ctx.shadowBlur = 4;
    ctx.stroke();

    const newLen = length * 0.75;
    for (let i = 0; i < 8; i++) {
      drawSBBranch(endX, endY, newLen, angle + (Math.PI / 4) * i, depth - 1);
    }
  }

  drawSBBranch(0, 0, 50, -Math.PI / 2, depth);

  restoreCanvas(ctx);
}


/***
 * 
 * This is the fractal logic for the Myers Fractal which 
 * Uses the Tree/H-Tree fractals as it's base.  This is
 * the VERY FIRST fractal of it's type and class. This is 
 * the fractal that lead to the discovery of the MIP, and, 
 * to the discovery of what I claim to be an entirely new genus
 * of fractals. 
 * 
 * This Fractal, while mathematically simple looking, actually employs
 * a great deal behind it and is where the papers MIP is derived. 
 * You can read more about MIP, The Myers Fractal, and it's logic 
 * here: 
 * https://github.com/LuminalSystems/luminalsystems.github.io/tree/main/papers/the-myers-fractal/the-myers-fractal.txt
 * 
***/
export function drawMyersFractal(ctx, depth) {
  if (depth <= 0 || isNaN(depth)) return;
  centerCanvas(ctx);

  const mouseY = ctx.canvas.width - 0.1;
  const rotation = 0.5;
  const baseLength = 50 + (mouseY / ctx.canvas.height) * 50;

  function drawBranchTreeLike(x, y, length, angle, depth) {
    if (depth === 1) return;
    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `hsl(${depth * 40 + rotation * 20}, 100%, 70%)`;
    ctx.lineWidth = Math.max(1, depth / 2);
    ctx.shadowColor = `hsl(${depth * 40 + rotation * 20}, 100%, 60%)`;
    ctx.shadowBlur = 8;
    ctx.stroke();

    const newLength = length * 0.7;
    drawBranchTreeLike(endX, endY, newLength, angle + Math.PI / 4, depth - 1);
    drawBranchTreeLike(endX, endY, newLength, angle - Math.PI / 4, depth - 1);
  }

  function drawBranchHTreeLike(x, y, length, angle, depth) {
    if (depth === 1) return;
    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `hsl(${depth * 40 + rotation * 20 + 180}, 100%, 70%)`;
    ctx.lineWidth = Math.max(1, depth / 2);
    ctx.shadowColor = `hsl(${depth * 40 + rotation * 20 + 180}, 100%, 60%)`;
    ctx.shadowBlur = 8;
    ctx.stroke();

    const newLength = length * 0.7;
    drawBranchHTreeLike(endX, endY, newLength, angle + Math.PI / 2, depth - 1);
    drawBranchHTreeLike(endX, endY, newLength, angle - Math.PI / 2, depth - 1);
  }

  const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  angles.forEach(angle => {
    drawBranchTreeLike(0, 0, baseLength, angle, depth);
    drawBranchHTreeLike(0, 0, baseLength, angle, depth);
  });

  restoreCanvas(ctx);
}
