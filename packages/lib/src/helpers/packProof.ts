import { Proof, SnarkJSProof } from "../types";

/**
 * Packs a proof into a format compatible with Block Qualified.
 * @param originalProof The proof generated with SnarkJS.
 * @returns The proof compatible with Block Qualified and Semaphore.
 */
export function packProof(originalProof: SnarkJSProof): Proof {
    return [
        originalProof.pi_a[0],
        originalProof.pi_a[1],
        originalProof.pi_b[0][1],
        originalProof.pi_b[0][0],
        originalProof.pi_b[1][1],
        originalProof.pi_b[1][0],
        originalProof.pi_c[0],
        originalProof.pi_c[1]
    ]
}
