import express from "express";
import ioserver from "socket.io";
import { createServer } from "http";
import { promisify } from "util";
import { createWriteStream } from "fs";
import * as childProcess from "child_process";

const execPromise = promisify(childProcess.exec);
const app = express();
const http = createServer(app);
const io = new ioserver.Server(http);
const PORT = 9001;

let child: childProcess.ChildProcess;

app.use(express.static("public"));

app.post("/run", async (req, res) => {
  try {
    const { stdout } = await execPromise("mktemp");
    const tempFile = stdout.trim();
    const scenarioFile = createWriteStream(tempFile);

    req.pipe(scenarioFile).on("finish", () => {
      if (child?.exitCode === null) {
        child.kill("SIGINT");
      }

      child = childProcess.spawn("artillery", ["run", tempFile]);

      if (child.stdout) {
        child.stdout.on("data", (output) => {
          io.emit("artilleryOutput", output.toString());
        });
      }
    });

    res.end();
  } catch (err) {
    console.log("Error getting scenario", err);
  }
});

http.listen(process.env.PORT || PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
