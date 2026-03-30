// ranprobpi_volume.js

const piDigits = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";

const rollPi = () => {
  const resultBox = document.getElementById("result");
  const volumeFill = document.getElementById("volumeFill");

  // Pick a random position to extract 4 digits
  const index = Math.floor(Math.random() * (piDigits.length - 4));
  const chosen = piDigits.slice(index, index + 4);

  // Method 1: convert to XX.XX%
  const method1 = parseFloat(chosen.slice(0, 2) + "." + chosen.slice(2));

  // Method 2: sum of digits
  const method2 = [...chosen].map(Number).reduce((a, b) => a + b, 0);

  // Randomly choose method
  const method = Math.random() < 0.5 ? 1 : 2;
  const volume = method === 1 ? method1 : method2;

  volumeFill.style.width = `${volume}%`;
  resultBox.innerHTML = `Selected Digits: <code>${chosen}</code><br>Method ${method} Result: <strong>${volume.toFixed(2)}%</strong>`;
};

document.getElementById("rollPi").addEventListener("click", rollPi);
