let audioContext = new window.AudioContext();
let activeNodes = [];
let notes = [];

const loopCheckbox = document.getElementById('loopCheckbox');

// Stores the timer ID for loop scheduling
let loopTimerId = null;

// JSON import
function handleImport(file) {

  // Create a new FileReader object to read the file
  const reader = new FileReader();

  // Define the onload event handler
  reader.onload = () => {
    try {
      // Attempt to parse the file contents as JSON and update the notes
      notes = JSON.parse(reader.result).notes;
      updateTable(); // Assuming updateTable is a function to update the table with the new notes
    } catch (error) {
      // Handle invalid JSON file format
      alert("Invalid JSON file format");
    }
  };

  // Read the file as text
  reader.readAsText(file);
}

// JSON export
function handleExport() {

  // Create a JSON string from the notes
  const jsonData = JSON.stringify({ notes }, null, 2);

  // Create a new Blob object from the JSON string
  const blob = new Blob([jsonData], { type: "application/json" });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a new anchor element to trigger the download
  const a = document.createElement("a");
  a.download = "arranger.json";
  a.href = url;

  // Add the anchor element to the body, trigger the click event, and remove it
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Handles form submission by retrieving inputs and passing them to addNote()
function handleAddNoteForm() {

  // Get form input elements
  const timeInput = document.getElementById("newTime");
  const freqInput = document.getElementById("newFreq");
  const durationInput = document.getElementById("newDuration");

  // Parse input values as numbers
  const time = parseFloat(timeInput.value) || 0;
  const frequency = parseFloat(freqInput.value);
  const duration = parseFloat(durationInput.value);

  // Check if values are valid (addNote returns true/false)
  addNote(time, frequency, duration);

  const newTime = time + duration;
  timeInput.value = newTime.toFixed(2);
}

// Adds note data to the table
function addNote(time, frequency, duration) {

  // Return false for validation failure
  if (isNaN(time) || isNaN(frequency) || isNaN(duration)) {
    alert("All fields must be valid numbers!");
    return;
  }

  // Proceed only if input is valid
  notes.push({ time, frequency, duration });
  updateTable();
}

// Updates table contents
function updateTable() {

  // Select the <tbody> element of the table with the ID "noteTable"
  const tbody = document.querySelector("#noteTable tbody");

  // Clear the existing content of the <tbody> element
  tbody.innerHTML = "";

  // Iterate over each note in the notes array
  notes.forEach((note, index) => {

    // Create a string representing a new row in the table
    const row = `
            <tr>
                <td><input type="number" class="time" value="${note.time}" step="0.1" onchange="setNoteValue(${index}, 'time', this.value)"></td>
                <td><input type="number" class="freq" value="${note.frequency}" step="5" min="20" onchange="setNoteValue(${index}, 'frequency', this.value)"></td>
                <td><input type="number" class="duration" value="${note.duration}" step="0.1" onchange="setNoteValue(${index}, 'duration', this.value)"></td>
                <td><button onclick="removeNote(${index})">Delete</button></td>
            </tr>
        `;

    // Insert the new row at the end of the <tbody> element
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// Removes selected note from table
function removeNote(index) {
  notes.splice(index, 1);
  updateTable();
}

function setNoteValue(index, prop, value) {
  const number = parseFloat(value);
  if (!isNaN(number)) {
    notes[index][prop] = number;
  }
}

// // Audio Playback Functions
function playSequence() {

  // Ensure previous sounds are stopped and timer cleared
  stopSequence();

  const startTime = audioContext.currentTime;
  const notesEndTime = notes.map(note => note.time + note.duration);

  // Calculate total sequence length
  const totalDuration = Math.max(...notesEndTime);

  activeNodes = notes.map((note) => {
    const osc = audioContext.createOscillator();
    osc.type = "sine";
    osc.frequency.value = note.frequency;

    const start = startTime + note.time;
    const end = start + note.duration;

    osc.start(start);
    osc.stop(end);
    osc.connect(audioContext.destination);

    return osc;
  });

  // Schedule the next loop if enabled
  if (loopCheckbox.checked) {
    const delayMs = totalDuration * 1000; // Convert seconds to milliseconds
    loopTimerId = setTimeout(() => playSequence(), delayMs);
  }
}

// Stops sequence and loop
function stopSequence() {
  activeNodes.forEach(node => node.stop());
  activeNodes = [];
  if (loopTimerId) {
    clearTimeout(loopTimerId);
    loopTimerId = null; // Reset the timer ID
  }
}

// Initialize UI
window.onload = updateTable;
