pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../lib/merkle_inclusion.circom";
include "../lib/semaphore_identity.circom";

template VerifyGrade(nLevels) {
    signal input identityNullifier;
    signal input identityTrapdoor;
    signal input gradeTreePathIndices[nLevels];
    signal input gradeTreeSiblings[nLevels];

    signal input currentGrade;

    signal output root;
    signal output gradeCommitment;

    component calculateSecret = CalculateSecret();
    calculateSecret.identityNullifier <== identityNullifier;
    calculateSecret.identityTrapdoor <== identityTrapdoor;

    component calculateGradeCommitment = Poseidon(2);
    calculateGradeCommitment.inputs[0] <== calculateSecret.out;
    calculateGradeCommitment.inputs[1] <== currentGrade;

    component inclusionProof = MerkleTreeInclusionProof(nLevels);
    inclusionProof.leaf <== calculateGradeCommitment.out;

    for (var i = 0; i < nLevels; i++) {
        inclusionProof.siblings[i] <== gradeTreeSiblings[i];
        inclusionProof.pathIndices[i] <== gradeTreePathIndices[i];
    }

    root <== inclusionProof.root;
    gradeCommitment <== calculateGradeCommitment.out;
}
