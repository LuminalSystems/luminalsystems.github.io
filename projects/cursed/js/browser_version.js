function getBrowserInfo() {
  const ua = navigator.userAgent;

  let match;
  let browser = "Unknown";
  let version = 0;

  if ((match = ua.match(/Chrome\/(\d+)/))) {
    browser = "Chrome";
    version = parseInt(match[1]);
  } else if ((match = ua.match(/Firefox\/(\d+)/))) {
    browser = "Firefox";
    version = parseInt(match[1]);
  } else if ((match = ua.match(/Edg\/(\d+)/))) {
    browser = "Edge";
    version = parseInt(match[1]);
  } else if ((match = ua.match(/Safari\/(\d+)/)) && !ua.includes("Chrome")) {
    browser = "Safari";
    version = parseInt(match[1]);
  } else if ((match = ua.match(/MSIE (\d+)/)) || ua.includes("Trident/")) {
    browser = "Internet Explorer";
    version = match ? parseInt(match[1]) : 11; // default to 11 for Trident
  }

  return { browser, version };
}

function updateVolume() {
  const { browser, version } = getBrowserInfo();
  const volumeDisplay = document.getElementById("volume-display");
  const browserInfo = document.getElementById("browser-info");

  if (browser === "Internet Explorer") {
    volumeDisplay.textContent = "Volume: 0% (get a real browser 💀)";
    browserInfo.textContent = `Browser Detected: Internet Explorer (version ${version})`;
    return;
  }

  let volume = Math.min(version, 100); // Cap volume at 100%
  volumeDisplay.textContent = `Volume: ${volume}%`;
  browserInfo.textContent = `Browser Detected: ${browser} (version ${version})`;
}

updateVolume();
