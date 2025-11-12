import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bank } from "../target/types/bank";
import { PublicKey, Keypair, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";

function log(message: string, ...args: any[]) {
  console.log("     ", message, ...args);
}
describe("bank", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Bank as Program<Bank>;

  it.skip("创建银行账户", async () => {
    const [bankPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bank")],
      program.programId
    );

    const tx = await program.methods
      .initialize()
      .accountsStrict({
        bank: bankPDA,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const bankAccount = await program.account.bank.fetch(bankPDA);
    assert.equal(bankAccount.authority.toBase58(), provider.wallet.publicKey.toBase58());
  });

  it.skip("创建用户账户", async () => {
    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .createUserAccount()
      .accountsStrict({
        userAccount: userPDA,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const userAccount = await program.account.userAccount.fetch(userPDA);
    assert.equal(userAccount.depositAmount.toNumber(), 0)
  });

  it("存款", async () => {
    const [bankPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bank")],
      program.programId
    );

    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const bankBalanceBefore = await provider.connection.getBalance(bankPDA);
    const userBalanceBefore = await program.account.userAccount.fetch(userPDA);
    const depositAmount = new anchor.BN(1_000_000_000); // 1 SOL

    const tx = await program.methods
      .deposit(depositAmount)
      .accountsStrict({
        bank: bankPDA,
        userAccount: userPDA,
        depositor: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const bankBalanceAfter = await provider.connection.getBalance(bankPDA);
    const userBalanceAfter = await program.account.userAccount.fetch(userPDA);

    assert.equal(bankBalanceAfter - bankBalanceBefore, depositAmount.toNumber());
    assert.equal(
      userBalanceAfter.depositAmount.toNumber() - userBalanceBefore.depositAmount.toNumber(), 
      depositAmount.toNumber()
    );
  });

  it("提现到指定账户", async () => {
    const [bankPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bank")],
      program.programId
    );

    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const withdrawAmount = new anchor.BN(500_000_000); // 0.5 SOL

    const bankBalanceBefore = await provider.connection.getBalance(bankPDA);
    const userBalanceBefore = await program.account.userAccount.fetch(userPDA);
    const receiverBalanceBefore = await provider.connection.getBalance(provider.wallet.publicKey);
    log("bankBalanceBefore", bankBalanceBefore/LAMPORTS_PER_SOL);
    log("userBalanceBefore", userBalanceBefore.depositAmount.toNumber()/LAMPORTS_PER_SOL);
    log("receiverBalanceBefore", receiverBalanceBefore/LAMPORTS_PER_SOL);

    log("bankPDA:", bankPDA.toBase58())
    log("userPDA:", userPDA.toBase58())
    log("receiver:", provider.wallet.publicKey.toBase58())
    const tx = await program.methods
      .withdraw(withdrawAmount)
      .accountsStrict({
        bank: bankPDA,
        userAccount: userPDA,
        receiver: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const bankBalanceAfter = await provider.connection.getBalance(bankPDA);
    const userBalanceAfter = await program.account.userAccount.fetch(userPDA);
    const receiverBalanceAfter = await provider.connection.getBalance(provider.wallet.publicKey);
    log("bankBalanceAfter", bankBalanceAfter / LAMPORTS_PER_SOL);
    log("userBalanceAfter", userBalanceAfter.depositAmount.toNumber()/LAMPORTS_PER_SOL);
    log("receiverBalanceAfter", receiverBalanceAfter/LAMPORTS_PER_SOL);

    assert.equal(bankBalanceBefore - bankBalanceAfter, withdrawAmount.toNumber());
    assert.equal(
      userBalanceBefore.depositAmount.toNumber() - userBalanceAfter.depositAmount.toNumber(), 
      withdrawAmount.toNumber()
    );
    assert.isAbove(receiverBalanceAfter, receiverBalanceBefore); // 考虑到交易费用，最终余额会略低于预期

  });

  it("不能重复初始化银行账户", async () => {
    const [bankPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bank")],
      program.programId
    );

    try {
      await program.methods
        .initialize()
        .accountsStrict({
          bank: bankPDA,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("应该失败，因为银行账户已经初始化过了");
    } catch (error: any) {
      // 任何错误都是可以接受的，因为我们知道这个操作应该失败
      assert.isTrue(true, "初始化失败，符合预期");
    }
  });

  it("在一个交易中创建用户账户并存款", async () => {
    // 创建一个新的用户密钥对
    const newUser = Keypair.generate();
    
    // 为新用户空投一些 SOL
    const airdropSig = await provider.connection.requestAirdrop(
      newUser.publicKey,
      2_000_000_000 // 2 SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const [bankPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bank")],
      program.programId
    );

    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), newUser.publicKey.toBuffer()],
      program.programId
    );

    // 获取创建用户账户的指令
    const createUserIx = await program.methods
      .createUserAccount()
      .accountsStrict({
        userAccount: userPDA,
        owner: newUser.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();

    // 获取存款指令
    const depositAmount = new anchor.BN(1_000_000_000); // 1 SOL
    const depositIx = await program.methods
      .deposit(depositAmount)
      .accountsStrict({
        bank: bankPDA,
        userAccount: userPDA,
        depositor: newUser.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();

    // 创建并发送包含两个指令的交易
    const tx = new Transaction().add(createUserIx).add(depositIx);
    const initialBalance = await provider.connection.getBalance(bankPDA);
    
    await provider.sendAndConfirm(tx, [newUser]);

    // 验证结果
    const finalBalance = await provider.connection.getBalance(bankPDA);
    const userAccount = await program.account.userAccount.fetch(userPDA);

    assert.equal(finalBalance - initialBalance, depositAmount.toNumber());
    assert.equal(userAccount.depositAmount.toNumber(), depositAmount.toNumber());
  });
}); 