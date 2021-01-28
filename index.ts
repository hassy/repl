import express from "express";
import tmp from "tmp";
import ioserver from "socket.io";
import { createServer } from "http";
import { createWriteStream } from "fs";
import * as childProcess from "child_process";

const app = express();
const http = createServer(app);
const io = new ioserver.Server(http);
const PORT = 9001;

let child: childProcess.ChildProcess;

enum ArtilleryStatus {
  READY = 0,
  RUNNING = 1,
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

      child = childProcess.spawn("artillery", ["run", tempFile.name]);
      io.emit("artilleryStatus", ArtilleryStatus.RUNNING);

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
