import express from "express";
import ioserver from "socket.io";
import { createServer } from "http";
import { promisify } from "util";
import { createWriteStream } from "fs";
import { exec, spawn } from "child_process";

const execPromise = promisify(exec);
const app = express();
const http = createServer(app);
const io = new ioserver.Server(http);
const PORT = 9001;

app.use(express.static("public"));

app.post("/run", async (req, res) => {
  try {
    const { stdout } = await execPromise("mktemp");
    const tempFile = stdout.trim();
    const scenarioFile = createWriteStream(tempFile);

    req.pipe(scenarioFile).on("finish", () => {
      const { stdout } = spawn("artillery", ["run", tempFile]);

      stdout.on("data", (output) => {
        io.emit("artilleryOutput", output.toString());
      });
    });

    res.end();
  } catch (err) {
    console.log("Error getting scenario", err);
  }
});

http.listen(process.env.PORT || PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
