import express from "express";
import tmp from "tmp";
import ioserver from "socket.io";
import { createServer } from "http";
import { createWriteStream, readFileSync } from "fs";
import * as childProcess from "child_process";
import * as Yaml from "js-yaml"

const app = express();
const http = createServer(app);
const io = new ioserver.Server(http);
const PORT = 9001;

let child: childProcess.ChildProcess;

enum ArtilleryStatus {
  READY = "READY",
  RUNNING = "RUNNING",
}

app.use(express.static("public"));

app.post("/run", async (req, res) => {
  try {
    const tempFile = tmp.fileSync();
    const scenarioFile = createWriteStream(tempFile.name);

    req.pipe(scenarioFile).on("finish", () => {
      if (child?.exitCode === null) {
        child.kill("SIGINT");
      }

      const extraArgs = [];
      const overrides = {};

      // TODO: YAML parse errors
      const doc = Yaml.load(readFileSync(tempFile.name), 'utf8');

      if(!doc.config.phases) {
        overrides["config"] = {
          "phases": [
            {
              "duration": 1,
              "arrivalCount": 1
            }
          ],
          "plugins": {"expect":{}}
        };
        extraArgs.push('-q');
        extraArgs.push('--overrides');
        extraArgs.push(JSON.stringify(overrides));
      }

      child = childProcess.spawn("artillery", extraArgs.concat(["run", tempFile.name]));
      io.emit("artilleryStatus", ArtilleryStatus.RUNNING);

      if (child.stdout) {
        child.stdout.on("data", (output) => {
          io.emit("artilleryOutput", output.toString());
        });

        child.stdout.on("end", () => {
          io.emit("artilleryStatus", ArtilleryStatus.READY);
        });
      }
    });

    res.end();
  } catch (err) {
    console.log("Error getting scenario", err);
  }
});

app.post("/stop", async (_, res) => {
  if (child?.exitCode === null) {
    console.log(`Terminating running child process: ${child.pid}`);

    child.kill("SIGINT");
  }

  io.emit("artilleryStatus", ArtilleryStatus.READY);

  res.sendStatus(204).end();
});

http.listen(process.env.PORT || PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
