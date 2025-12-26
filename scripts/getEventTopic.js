const { ethers } = require('ethers');

const signatures = [
  'AttestedToRisk(bytes32,uint256,uint256,address,(uint256))',
  'AttestedToData(bytes32,uint256,address,(bytes32,string))',
];

signatures.forEach((sig) => {
  console.log(`\nEvent: ${sig}`);
  console.log(`Topic0: ${ethers.id(sig)}`);
});
