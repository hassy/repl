const socket = io();
const resultElement = document.getElementById("result");
const runScenarioButton = document.getElementById("run-scenario");
const stopScenarioButton = document.getElementById("stop-scenario");

const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  mode: "yaml",
  styleActiveLine: true,
  lineNumbers: true,
});

editor.setSize(null, 690);

runScenarioButton.addEventListener("click", async (evt) => {
  evt.preventDefault();
  resultElement.innerText = "";

  await submitScenario(editor.getValue());
});

stopScenarioButton.addEventListener("click", async (evt) => {
  evt.preventDefault();

  try {
    await fetch("/stop", {
      method: "POST",
      body: {},
    });
  } catch (err) {
    console.log("Error stopping scenario", err);
  }
});

async function submitScenario(value) {
  try {
    await fetch("/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/yaml",
      },
      cache: "no-cache",
      body: value,
    });
  } catch (err) {
    console.log("Error posting scenario", err);
  }
}

socket.on("artilleryOutput", (data) => {
  resultElement.innerText += data;
});

socket.on("artilleryStatus", (status) => {
  if (status === "READY") {
    stopScenarioButton.style.display = "none";
    runScenarioButton.style.display = "block";
  }

  if (status === "RUNNING") {
    stopScenarioButton.style.display = "block";
    runScenarioButton.style.display = "none";
  }
});
