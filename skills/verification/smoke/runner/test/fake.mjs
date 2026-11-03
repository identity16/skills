// Fake adapters that record every call, so tests can assert the order of acquire and release.
import { PAGE } from "../run.mjs";

export const page = () => Object.fromEntries(PAGE.map((op) => [op, async () => {}]));

const tags = ({ stale, device }) => `${stale ? " stale" : ""}${device ? " on-device" : ""}`;

export const fakeDevice = (name, log, { failProvision, failTeardown, handle } = {}) => ({
  name,
  async provision() {
    log.push(`provision ${name}`);
    if (failProvision) throw new Error("provision failed");
    return { handle: handle ?? page(), ref: { name } };
  },
  async teardown(args) {
    log.push(`teardown ${name}${tags(args)}`);
    if (failTeardown) throw new Error("teardown failed");
  },
});

export const fakeCase = (name, log, { failCleanup } = {}) => ({
  name,
  async setup() {
    log.push(`setup ${name}`);
    return { handle: { name }, ref: { name } };
  },
  async cleanup(args) {
    log.push(`cleanup ${name}${tags(args)}`);
    if (failCleanup) throw new Error("cleanup failed");
  },
});
