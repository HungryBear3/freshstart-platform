declare module "canvas-confetti" {
  export interface Options {
    particleCount?: number
    angle?: number
    spread?: number
    startVelocity?: number
    decay?: number
    scalar?: number
    origin?: { x?: number; y?: number }
    zIndex?: number
  }

  function confetti(options?: Options): Promise<null>
  export default confetti
}
