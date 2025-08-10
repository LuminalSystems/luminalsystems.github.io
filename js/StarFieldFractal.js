const starfield = document.getElementById('starfield');
const ctxStar = starfield.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
starfield.width = width;
starfield.height = height;

let rotation = 0;
//let twigs = [];
let novaMode = false;
let latticeMode = false;
let isHTree = false;

let mouseX = width/2;
let mouseY = height/2;

document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    starfield.width = width;
    starfield.height = height;
});

document.addEventListener('keydown', (e) => {
    if (e.key === '~') novaMode = true;
    if (e.key === '#') latticeMode = !latticeMode;
    if (e.key === '!') isHTree = !isHTree;
});

function drawBranch(x, y, length, angle, depth) {
    if (depth === 1) {
        return;
    }

    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    ctxStar.beginPath();
    ctxStar.moveTo(x, y);
    ctxStar.lineTo(endX, endY);
    ctxStar.strokeStyle = `hsl(${depth * 40 + rotation * 20}, 100%, 70%)`;
    ctxStar.lineWidth = Math.max(1, depth/2);
    ctxStar.shadowColor = `hsl(${depth * 40 + rotation * 20}, 100%, 60%)`;
    ctxStar.shadowBlur = 8;
    ctxStar.stroke();

    const newLength = length * 0.7;

    if (isHTree) {
        drawBranch(endX, endY, newLength, angle + Math.PI / 4, depth - 1);
        drawBranch(endX, endY, newLength, angle - Math.PI / 4, depth - 1);
    } else {
        drawBranch(endX, endY, newLength, angle + Math.PI / 2, depth - 1);
        drawBranch(endX, endY, newLength, angle - Math.PI / 2, depth - 1);
    }
}

function drawBranchNew(x, y, length, angle, depth) {
    if (depth === 1) {
        return;
    }

    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    ctxStar.beginPath();
    ctxStar.moveTo(x, y);
    ctxStar.lineTo(endX, endY);
    ctxStar.strokeStyle = `hsl(${depth * 40 + rotation * 20}, 100%, 70%)`;
    ctxStar.lineWidth = Math.max(1, depth/2);
    ctxStar.shadowColor = `hsl(${depth * 40 + rotation * 20}, 100%, 60%)`;
    ctxStar.shadowBlur = 8;
    ctxStar.stroke();

    const newLength = length * 0.7;

    if (isHTree) {
        drawBranchNew(endX, endY, newLength, angle + Math.PI / 2, depth - 1);
        drawBranchNew(endX, endY, newLength, angle - Math.PI / 2, depth - 1);
    } else {
        drawBranchNew(endX, endY, newLength, angle + Math.PI / 4, depth - 1);
        drawBranchNew(endX, endY, newLength, angle - Math.PI / 4, depth - 1);
    }
}

function animate() {
    ctxStar.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctxStar.fillRect(0, 0, width, height);

    ctxStar.save();
    ctxStar.translate(width/2, height/2 + 100);
    ctxStar.rotate(rotation);

    const baseLength = 50 + (mouseY/height)*50;
    const depth = latticeMode ? 11 : 8;

    drawBranch(0, 0, baseLength, -Math.PI / 2, depth);
    drawBranch(0, 0, baseLength, Math.PI / 2, depth);
    drawBranch(0, 0, baseLength, -Math.PI, depth);
    drawBranch(0, 0, baseLength, Math.PI * 2, depth);
	
    drawBranchNew(0, 0, baseLength, -Math.PI / 2, depth);
    drawBranchNew(0, 0, baseLength, Math.PI / 2, depth);
    drawBranchNew(0, 0, baseLength, -Math.PI, depth);
    drawBranchNew(0, 0, baseLength, Math.PI * 2, depth);

    ctxStar.restore();
    rotation += novaMode ? 0.1 : 0.001;

    requestAnimationFrame(animate);
}

animate();
