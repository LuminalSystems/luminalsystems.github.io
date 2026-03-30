const signs = [
  { sign: "Capricorn", start: "01-01", end: "01-19" },
  { sign: "Aquarius", start: "01-20", end: "02-18" },
  { sign: "Pisces", start: "02-19", end: "03-20" },
  { sign: "Aries", start: "03-21", end: "04-19" },
  { sign: "Taurus", start: "04-20", end: "05-20" },
  { sign: "Gemini", start: "05-21", end: "06-20" },
  { sign: "Cancer", start: "06-21", end: "07-22" },
  { sign: "Leo", start: "07-23", end: "08-22" },
  { sign: "Virgo", start: "08-23", end: "09-22" },
  { sign: "Libra", start: "09-23", end: "10-22" },
  { sign: "Scorpio", start: "10-23", end: "11-21" },
  { sign: "Sagittarius", start: "11-22", end: "12-21" },
  { sign: "Capricorn", start: "12-22", end: "12-31" }
];

function getZodiac(month, day) {
  const date = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  return signs.find(({ start, end }) => date >= start && date <= end)?.sign || "Unknown";
}

function fakeAlignmentValue(sign) {
  // Generate a pseudo-random volume percentage based on the sign name
  const sum = [...sign].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const moonMod = new Date().getDate();
  const alignment = (sum % 100 + moonMod) % 101;
  return alignment;
}

function calculateVolume() {
  const dateInput = document.getElementById("birthdate").value;
  if (!dateInput) return;

  const date = new Date(dateInput);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const sign = getZodiac(month, day);
  const volume = fakeAlignmentValue(sign);

  document.getElementById("output").innerHTML = `
    <p>Your sign is <strong>${sign}</strong>.</p>
    <p>Astrological alignment sets your volume to: <strong>${volume}%</strong></p>`
};