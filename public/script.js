const socket = io();
const resultElement = document.getElementById("result");
const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  mode: "yaml",
  lineNumbers: true,
});

editor.setSize(null, 690);

document
  .getElementById("run-scenario")
  .addEventListener("click", async (evt) => {
    evt.preventDefault();
    resultElement.innerText = "";

    await sendScenario(editor.getValue());
  });

async function sendScenario(value) {
  console.log(value);
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
