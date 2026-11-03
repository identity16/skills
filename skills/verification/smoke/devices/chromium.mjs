// Reference device: headless Chromium through Playwright. Needs `playwright-core` and a Chromium it can launch
// (`npx playwright-core install chromium`).
import { execFileSync } from "node:child_process";
import { chromium as playwright } from "playwright-core";

const LEVELS = { error: "error", warning: "warning" };

// A pid in a stale ref may have been reused; only kill it if it is still a Chromium.
const killIfChromium = (pid) => {
  try {
    if (/chrom/i.test(execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" }))) {
      process.kill(pid, "SIGKILL");
    }
  } catch {}
};

export const chromium = ({ name = "chromium", viewport = { width: 390, height: 844 }, launch = {} } = {}) => {
  const servers = new WeakMap();
  return {
    name,
    async provision() {
      // launchServer rather than launch: only the server exposes the browser's pid, which a stale ref needs.
      const server = await playwright.launchServer({
        headless: true,
        ...launch,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
      });
      try {
        const browser = await playwright.connect(server.wsEndpoint());
        const page = await browser.newPage({ viewport });
        const logs = [];
        page.on("console", (m) => logs.push({ level: LEVELS[m.type()] ?? "info", text: m.text() }));
        page.on("pageerror", (e) => logs.push({ level: "error", text: e.message }));
        const handle = {
          goto: (url) => page.goto(url).then(() => {}),
          click: (text) => page.getByText(text, { exact: true }).first().click(),
          eval: (fn, arg) => page.evaluate(fn, arg),
          screenshot: (path) => page.screenshot({ path }).then(() => {}),
          logs: () => logs.splice(0),
          raw: page,
        };
        servers.set(handle, server);
        return { handle, ref: { pid: server.process().pid } };
      } catch (error) {
        await server.close();
        throw error;
      }
    },
    async teardown({ handle, ref }) {
      if (handle) return servers.get(handle).close();
      killIfChromium(ref.pid);
    },
  };
};

export default chromium();
