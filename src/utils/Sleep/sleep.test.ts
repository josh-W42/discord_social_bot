import { Sleep } from "./Sleep";

describe("Sleep", () => {
  it("resolves after given number of milliseconds", async () => {
    const start = Date.now();
    await Sleep(10);
    const end = Date.now();

    expect(end - start).toBeGreaterThanOrEqual(10);
  });

  it("resolves to void", async () => {
    const result = await Sleep(1);

    expect(result).toBeUndefined();
  });
});
