import { Group } from "@semaphore-protocol/group";
import { Identity } from "@semaphore-protocol/identity";
import { expect } from "chai";
import { Signer, utils } from "ethers"
import { run } from "hardhat";
import { describe } from "mocha";
import { Poseidon, TestAnswers, TestParameters, TestFullProof, buildPoseidon, generateOpenAnswers, generateTestProof, rootFromLeafArray } from "../../proof/src"
import { TestVerifier } from "../typechain-types"

describe("TestVerifier contract", () => {
    let poseidon: Poseidon; 

    let identity: Identity

    let testAnswers: TestAnswers;
    let testParameters: TestParameters;

    let identityGroup: Group;
    let gradeGroup: Group;

    let testVerifierContract: TestVerifier;
    let signers: Signer[];
    let accounts: string[];

    let proof: TestFullProof;

    const testVerifierWasmFilePath = "../proof/snark-artifacts/testVerifier.wasm";
    const testVerifierZkeyFilePath = "../proof/snark-artifacts/testVerifier.zkey";
    const snarkArtifacts = {
        wasmFilePath: testVerifierWasmFilePath,
        zkeyFilePath: testVerifierZkeyFilePath
    }

    before(async () => {
        poseidon = await buildPoseidon();

        const { testVerifier } = await run("deploy:test-verifier", {
            logs: false
        })

        testVerifierContract = testVerifier

        signers = await run("accounts", { logs: false })
        accounts = await Promise.all(signers.map((signer: Signer) => signer.getAddress()))

        identity = new Identity("deenz")

        const _openAnswersHashes = [
            poseidon([BigInt(utils.keccak256(utils.toUtf8Bytes("sneed's")))]), 
            poseidon([BigInt(utils.keccak256(utils.toUtf8Bytes("feed")))]), 
            poseidon([BigInt(utils.keccak256(utils.toUtf8Bytes("seed")))])
        ]
        const openAnswersHashes = Array(64).fill( poseidon([BigInt(utils.keccak256(utils.toUtf8Bytes("")))]) )
        openAnswersHashes.forEach( (_, i) => { if (i < _openAnswersHashes.length) { openAnswersHashes[i] = _openAnswersHashes[i] }})
        
        const solutionHash = rootFromLeafArray(poseidon, Array.from({length: 64}, (_, i) => 1))
        const openAnswersHashesRoot = rootFromLeafArray(poseidon, openAnswersHashes)

        const multipleChoiceAnswers = Array.from({length: 64}, (_, i) => 1)
        const openAnswers = generateOpenAnswers(["sneed's", "feed", "seed"])

        testAnswers = {
            multipleChoiceAnswers,
            openAnswers
        }
        testParameters = {
            minimumGrade: 50,
            multipleChoiceWeight: 50, 
            nQuestions: 3,
            solutionHash,
            openAnswersHashes,
            openAnswersHashesRoot
        }

        identityGroup = new Group(1, 16)
        gradeGroup = new Group(1, 16)
    })

    it("Should be able to generate the proof using the prover package", async () => {
        proof = await generateTestProof(
            identity,
            testAnswers,
            testParameters,
            identityGroup,
            gradeGroup,
            snarkArtifacts
        )
    })

    describe("verifyProof", () => {
        it("Should return `true` when verifying a valid proof", async () => {
            const isValid = await testVerifierContract.verifyProof(
                proof.proof.a,
                proof.proof.b,
                proof.proof.c,
                proof.publicSignals
            ) 
            expect(isValid).to.be.equal(true)
        })

        it("Should return `false` when verifying a valid proof that has a changed public input", async () => {
            const bogusSignals = [...proof.publicSignals]
            bogusSignals[0] = BigInt(350)  // bout tree fiddy

            const notValid = await testVerifierContract.verifyProof(
                proof.proof.a,
                proof.proof.b,
                proof.proof.c,
                bogusSignals
            ) 
            expect(notValid).to.be.equal(false)
        })
    })
})