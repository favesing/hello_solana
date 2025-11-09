import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMint2Instruction,
  getMinimumBalanceForRentExemptMint,
  getMint
} from '@solana/spl-token';
import { LOCALNET_URL, logMintData } from './lib/utils.ts';

console.log(`连接到 Solana ${LOCALNET_URL}...`);
const connection = new Connection(LOCALNET_URL, 'confirmed');

// 创建一个代币
// 调用 System Program 创建一个新账户。
// 调用 Token Extensions Program 将该账户初始化为一个 Mint。
const wallet = Keypair.generate();
console.log('钱包公钥:', wallet.publicKey.toString());

// 请求空投一些 SOL 到钱包账户，以支付创建 Mint 账户的费用
console.log('请求空投 2 个 SOL 到钱包账户...');
const airdropSignature = await connection.requestAirdrop(
  wallet.publicKey,
  2 * LAMPORTS_PER_SOL
);

const lastestBlockhash = await connection.getLatestBlockhash();
const airdropTx = await connection.confirmTransaction({
  signature: airdropSignature,
  blockhash: lastestBlockhash.blockhash,
  lastValidBlockHeight: lastestBlockhash.lastValidBlockHeight
});
if(airdropTx.value.err){
  console.error("空投失败:", airdropTx.value.err)
  throw new Error("空投失败")
}
console.log("空投成功，签名:", airdropSignature)
const walletBalance = await connection.getBalance(wallet.publicKey);
console.log('钱包账户余额:', walletBalance / LAMPORTS_PER_SOL, 'SOL');


// 创建 Mint 账户
const mint = Keypair.generate();
console.log('Mint 账户公钥:', mint.publicKey.toString());

// 计算 Mint 账户的 rent 费用豁免金额
const rentExemptAmount = await getMinimumBalanceForRentExemptMint(connection);

// 创建初始化 Mint 指令
console.log('创建 Mint 账户...');
const createAccountInstruction = SystemProgram.createAccount({
  fromPubkey: wallet.publicKey, // 支付账户
  newAccountPubkey: mint.publicKey, // 新账户关联 Mint 账户公钥
  lamports: rentExemptAmount, // 创建账户所需的 SOL 数量
  space: MINT_SIZE, // 账户大小，单位为字节
  programId: TOKEN_2022_PROGRAM_ID // 账户所有权使用 Token 2022 Program
})

console.log('初始化 Mint 账户 data 类型...');
const initializeMintInstruction = createInitializeMint2Instruction(
  mint.publicKey, // Mint 账户公钥
  2, // 小数位数
  wallet.publicKey, // Mint 权限
  wallet.publicKey, // Freeze 权限
  TOKEN_2022_PROGRAM_ID // 使用 Token 2022 Program
)

// 创建并发送交易
const transaction = new Transaction().add(
  createAccountInstruction,
  initializeMintInstruction
);

console.log('发送创建并初始化 Mint 交易...');
const signature = await sendAndConfirmTransaction(connection, transaction, [
  wallet,
  mint
]);
console.log('交易已发送，签名:', signature);

// 获取并打印 Mint 账户信息
const mintAccountInfo = await getMint(
  connection, mint.publicKey, "confirmed", TOKEN_2022_PROGRAM_ID
);
logMintData(mintAccountInfo);