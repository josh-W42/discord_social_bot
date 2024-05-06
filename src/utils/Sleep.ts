/**
 * This TypeScript function Sleep takes a parameter ms (representing milliseconds) and returns a Promise that resolves after the specified number of milliseconds. It uses the setTimeout function to delay the resolution of the Promise. This can be useful for introducing delays in asynchronous operations, such as waiting for a certain period of time before continuing execution.
 * @param ms - The number of milliseconds to wait.
 * @returns - A Promise that resolves after the specified number of milliseconds.
 */
export function Sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
