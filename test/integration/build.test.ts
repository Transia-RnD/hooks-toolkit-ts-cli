import { buildDir } from "../../src/build";

describe("tmp integration", () => {
  it("tmp integration test", async () => {
    buildDir("contracts", "build");
    expect(1).toBe(2);
  });
});
