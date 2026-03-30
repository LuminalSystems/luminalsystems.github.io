function calculateVolume() {
  const now = new Date();
  const unixTime = Math.floor(now.getTime() / 1000);

  let hours = now.getHours(); // 0-23
  let minutes = now.getMinutes();

  // Convert to military time (HHMM)
  const militaryTime = (hours * 100) + minutes;

  // Avoid divide-by-zero chaos (e.g., 00:00)
  const divisor = militaryTime === 0 ? 1 : militaryTime;

  // Calculate cursed ratio
  const rawValue = unixTime / divisor;

  // Convert result into a pseudo-volume value
  const volumeMode = now.getHours() >= 12 ? 'hours' : 'days';
  let volume;

  if (volumeMode === 'hours') {
    const totalMinutes = Math.floor(rawValue);
    volume = Math.min((totalMinutes / 60).toFixed(2), 100);
  } else {
    const totalSeconds = Math.floor(rawValue);
    volume = Math.min((totalSeconds / 86400).toFixed(2), 100);
  }

  document.getElementById('volume-display').innerText = `Volume: ${volume}%`;
}
