import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";
import { AnchorCurd } from "../target/types/anchor_curd";

describe("anchor_curd", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;
  const wallet = provider.wallet;
  const program = anchor.workspace.anchorCurd as Program<AnchorCurd>;
  const web3 = anchor.web3;
  const [messagePda, messageBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("message"), wallet.publicKey.toBuffer()], program.programId
  );
  const [vaultPda, vaultBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), wallet.publicKey.toBuffer()], program.programId
  );

  before(async () => {
    console.log("messagePda", messagePda.toString())
    console.log("messageBump", messageBump)
    console.log("vaultPda", vaultPda.toString())
    console.log("vaultBump", vaultBump)
  })

  it("Create Message Account", async () => {
    const message = "Hello, World!";
    const txSignature = await program.methods
      .create(message)
      .accountsStrict({
        messageAccount: messagePda,
        user: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed" });

    
    const messageAccount = await program.account.messageAccount.fetch(messagePda, "confirmed");

    console.log("Message Account Data:", JSON.stringify(messageAccount, null, 2));
    console.log(
      "交易签名:", 
      `https://solana.fm/tx/${txSignature}?cluster=localnet-solana`
      );

    expect(messageAccount.user.toString()).to.equal(wallet.publicKey.toString());
    expect(messageAccount.message).to.equal(message);
    expect(messageAccount.bump).to.equal(messageBump);
  })
  
  it("Update Message Account", async () => {
    const message = "Hello, Solana!";
    const txSignature = await program.methods
      .update(message)
      .accountsStrict({
        messageAccount: messagePda,
        vaultAccount: vaultPda,
        user: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed" });

    const messageAccount = await program.account.messageAccount.fetch(
      messagePda,"confirmed"
    );

    console.log(JSON.stringify(messageAccount, null, 2));
    console.log(
      "交易签名:",
      `https://solana.fm/tx/${txSignature}?cluster=localnet-solana`
    );
    expect(messageAccount.user.toString()).to.equal(wallet.publicKey.toString());
    expect(messageAccount.message).to.equal(message);
    expect(messageAccount.bump).to.equal(messageBump);
  })

  it("Delete Message Account", async () => {
    const message = "Hello, World!";
    const txSignature = await program.methods
      .delete()
      .accountsStrict({
        messageAccount: messagePda,
        vaultAccount: vaultPda,
        user: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc({ commitment: "confirmed" });

    const messageAccount = await program.account.messageAccount.fetchNullable(
      messagePda,
      "confirmed"
    );

    console.log("Expect Null:", JSON.stringify(messageAccount, null, 2));
    console.log(
      "交易签名:",
      `https://solana.fm/tx/${txSignature}?cluster=localnet-solana`
    );
    expect(messageAccount).to.equal(null);
  })
});
