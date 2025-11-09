import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorStart } from "../target/types/anchor_start";
import { expect } from "chai";

describe("anchor_start", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;
  const wallet = provider.wallet
  const program = anchor.workspace.anchorStart as Program<AnchorStart>;
  const web3 = anchor.web3;

  it("Is initialized!", async () => {
    const newAccount = web3.Keypair.generate();

    console.log("初始化新账户:", newAccount.publicKey.toString());
    const txSignature = await program.methods
      .initialize(new anchor.BN(42))
      .accounts({
        newAccount: newAccount.publicKey,
        signer: wallet.publicKey,
      }).signers([newAccount]).rpc();
      
    console.log(`命令确认交易: 'solana confirm -v ${txSignature}'`);

    const latestBlockhash = await connection.getLatestBlockhash ();
    const confirmedTx = await connection.confirmTransaction({
      signature: txSignature,
      ...latestBlockhash
    });
    console.log("Transaction confirmation:", confirmedTx);  

    const account = await program.account.newAccount.fetch(newAccount.publicKey);
    console.log("新账户数据:", account.data.toString());

    expect(account.data.toNumber()).to.equal(42);
  });
});
