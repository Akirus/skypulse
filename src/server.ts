import "dotenv/config";
import { getConfig } from "./config";
import { createApp } from "./app";
import { logInfo } from "./logger";

const app = createApp();
const config = getConfig();

app.listen(config.port, "0.0.0.0", () => {
  logInfo("server started", {
    port: config.port
  });
});
