import { DiscordRequest } from "./DiscordRequest";

describe("DiscordRequest function", () => {
  test("should return response when status is 200", async () => {
    // Mock successful response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Successful response" }),
    });

    const response = await DiscordRequest("/test", {});
    expect(response).toEqual({ ok: true, json: expect.any(Function) });
  });

  test("should throw an error when status is not 200", async () => {
    // Mock unsuccessful response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed response" }),
    });

    await expect(DiscordRequest("/test", {})).rejects.toThrowError(
      JSON.stringify({ error: "Failed response" })
    );
  });
});
