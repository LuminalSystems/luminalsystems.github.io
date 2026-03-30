// File: js/brokencube_volume.js

const container = document.getElementById("cubeContainer");
const volumeDisplay = document.getElementById("volumeDisplay");
let totalVolume = 0;
const maxCubes = 100;

function createMiniCube(index) {
  const cube = document.createElement("div");
  cube.className = "miniCube";
  cube.textContent = index + 1;

  let volume = 1;
  cube.setAttribute("data-volume", volume);
  cube.setAttribute("data-index", index);
  cube.setAttribute("data-toggled", "false");

  cube.addEventListener("click", () => {
    const toggled = cube.getAttribute("data-toggled") === "true";
    cube.setAttribute("data-toggled", toggled ? "false" : "true");
    volume = toggled ? 1 : 0;
    cube.style.backgroundColor = toggled ? "#555" : "#0f0";
    updateTotalVolume();
  });

  return cube;
}

function explodeCube() {
  container.innerHTML = "";
  for (let i = 0; i < maxCubes; i++) {
    const cube = createMiniCube(i);
    container.appendChild(cube);
  }
  updateTotalVolume();
}

function updateTotalVolume() {
  const cubes = document.querySelectorAll(".miniCube");
  let sum = 0;
  cubes.forEach(cube => {
    const toggled = cube.getAttribute("data-toggled") === "true";
    if (!toggled) sum++;
  });
  totalVolume = sum;
  volumeDisplay.textContent = `Total Volume: ${totalVolume}%`;
}

// Initial cube to click to trigger explosion
const bigCube = document.createElement("div");
bigCube.className = "bigCube";
bigCube.textContent = "Click to Explode";
bigCube.addEventListener("click", () => {
  bigCube.remove();
  explodeCube();
});

container.appendChild(bigCube);

// document.head.appendChild(style);
