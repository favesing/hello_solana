import { Connection, PublicKey } from "@solana/web3.js"

export const LOCALNET_URL = "http://localhost:8899"
export const DEVNET_URL = "https://api.devnet.solana.com"
export const TESTNET_URL = "https://api.testnet.solana.com"
export const MAINNET_BETA_URL = "https://api.mainnet-beta.solana.com"

export async function fetchTokenAccountInfo(connection:Connection, address: string){
  const pubkey = new PublicKey(address)
  const accountInfo = await connection.getAccountInfo(pubkey)
  return accountInfo
}

export function logAccountInfo(accountInfo: any){
  console.log(JSON.stringify(accountInfo, (key, value)=>{
    if(key === "data" && value && value.length > 1){
      return [
        value[0],
        "...truncated, total bytes: " + value.length + "...",
        value[value.length - 1]
      ]
    }else{
      return value
    }
  }, 2))
}

export function logMintData(mintData: any){
  console.log(JSON.stringify(mintData,(key, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (Buffer.isBuffer(value)) {
      return `<Buffer ${value.toString("hex")}>`;
    }
    return value;
  },2))
}
