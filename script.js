const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  mode: "yaml",
  lineNumbers: true,
});

editor.setSize(null, 750);
