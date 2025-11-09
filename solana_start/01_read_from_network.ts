import { Connection, PublicKey } from "@solana/web3.js"
import { 
  fetchTokenAccountInfo, logAccountInfo, logMintData,
  LOCALNET_URL, DEVNET_URL, TESTNET_URL, MAINNET_BETA_URL,
} from "./lib/utils.ts"
import { getMint } from "@solana/spl-token"

console.log(`连接到 Solana ${MAINNET_BETA_URL}...`)
const connection = new Connection(MAINNET_BETA_URL, "confirmed")

// 1.获取 Token Account 账户
// Token Program: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
//    提供了转账、冻结和铸造代币的基本功能
// Token Extensions Program: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb，
//    包含与 Token Program 相同的所有功能，但还提供了扩展功能，例如保密转账、自定义转账逻辑、扩展元数据等
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
const TOKEN_EXTENSIONS_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"

console.log("获取 Token Program 账户:")
const accountInfo = await fetchTokenAccountInfo(connection, TOKEN_PROGRAM_ID)
logAccountInfo(accountInfo)

console.log("获取 Token Extensions Program(Toke-2022) 账户:")
const accountInfoExtensions = await fetchTokenAccountInfo(connection, TOKEN_EXTENSIONS_PROGRAM_ID)
logAccountInfo(accountInfoExtensions)

// 2.获取 Mint 账户
console.log("获取 Mint 账户:")
const MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const mintAccountInfo = await fetchTokenAccountInfo(connection, MINT_ADDRESS)
logAccountInfo(mintAccountInfo)

// 3.反序列化 Mint 账户的 data 数据
console.log("反序列化 Mint 账户的 data 数据:")
const mintData = await getMint(connection, new PublicKey(MINT_ADDRESS))
logMintData(mintData)
