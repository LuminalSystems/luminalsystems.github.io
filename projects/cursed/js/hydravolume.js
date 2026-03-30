const container = document.getElementById("hydra-container");
let sliderCount = 1;
let maxSliders = 100;

function createSlider(volume = 50) {
  if (sliderCount > maxSliders) return;

  const slider = document.createElement("input");
  slider.type = "range";
  slider.className = "hydra-slider";
  slider.min = 0;
  slider.max = 100;
  slider.value = volume;

  slider.addEventListener("input", () => {
    if (sliderCount < maxSliders) {
      // Clone itself into 2 new sliders with random values
      for (let i = 0; i < 2; i++) {
        const newSlider = createSlider(Math.floor(Math.random() * 101));
        container.appendChild(newSlider);
      }
      slider.remove(); // remove current slider
      sliderCount += 1;
    }
  });

  return slider;
}

// Start with 1 slider
container.appendChild(createSlider());
