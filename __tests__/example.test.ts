/**
 * Example test file to verify Jest is working correctly
 */
describe("Example Test Suite", () => {
  it("should pass a basic test", () => {
    expect(1 + 1).toBe(2)
  })

  it("should handle string operations", () => {
    const str = "Hello, World!"
    expect(str).toContain("World")
    expect(str.length).toBeGreaterThan(0)
  })

  it("should work with arrays", () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })
})
