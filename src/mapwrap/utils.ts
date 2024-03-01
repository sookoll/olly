export const range = (start: number, end: number): number[] => {
  const inc = (end - start) / Math.abs(end - start)
  return Array.from(Array(Math.abs(end - start) + 1), (_, i) => start + i * inc)
}

export const uid = (): string => {
  return Math.random().toString(36).substring(2, 10)
}
