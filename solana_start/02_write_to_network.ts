import {
  LAMPORTS_PER_SOL,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Message,
} from "@solana/web3.js"
import { LOCALNET_URL, DEVNET_URL } from "./lib/utils.ts"

console.log(`连接到 Solana ${LOCALNET_URL}...`)
const connection = new Connection(LOCALNET_URL, "confirmed")

// 转移 SOL
// 1.生成一个新的 Keypair 作为发送方
const sender = Keypair.generate()
const receiver = Keypair.generate()
console.log("发送方公钥:", sender.publicKey.toString())
console.log("接收方公钥:", receiver.publicKey.toString())

// 2.请求空投一些 SOL 到发送方账户
console.log("请求空投 1 个 SOL 到发送方账户...")
const airdropSignature = await connection.requestAirdrop(
  sender.publicKey,
  LAMPORTS_PER_SOL
)

//await connection.confirmTransaction(airdropSignature, "confirmed")
const lastestBlockhash = await connection.getLatestBlockhash()
const airdropTx = await connection.confirmTransaction({
  signature: airdropSignature,
  blockhash: lastestBlockhash.blockhash,
  lastValidBlockHeight: lastestBlockhash.lastValidBlockHeight,
})
if(airdropTx.value.err){
  console.error("空投失败:", airdropTx.value.err)
  throw new Error("空投失败")
}
console.log("空投成功，签名:", airdropSignature)

// 3.检查发送方账户余额
console.log("获取发送方账户余额...")
let senderBalance = await connection.getBalance(sender.publicKey)
console.log("发送方账户余额:", senderBalance / LAMPORTS_PER_SOL, "SOL")

// 4.创建转账交易
console.log("创建转账交易, 0.01 SOL...")
const transferTx = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: receiver.publicKey,
  lamports: 0.01 * LAMPORTS_PER_SOL, // 转账 0.01 个 SOL
})

// 5.创建交易并添加转账指令
const transaction = new Transaction().add(transferTx)

// 6.签名并发送交易
console.log("发送转账交易, 0.01 SOL...")
const signature = await sendAndConfirmTransaction(connection, transaction, [
  sender,
])
console.log("转账交易已发送，签名:", signature)

// 7.检查发送方和接收方账户余额
senderBalance = await connection.getBalance(sender.publicKey)
let receiverBalance = await connection.getBalance(receiver.publicKey)
console.log("发送方账户余额:", senderBalance / LAMPORTS_PER_SOL, "SOL")
console.log("接收方账户余额:", receiverBalance / LAMPORTS_PER_SOL, "SOL")

