import axios from "axios";
import { writeFile } from 'node:fs/promises';

interface ChainInfo {
  chainName: string;
}

enum ChainId {
  Bifrost = 2001,
  Moonriver = 2023,
  Moonbeam = 2004,
}

enum NetworkId {
  Kusuma = 200,
  Polkadot = 300,
}

const ChainInfoMap: Record<number, ChainInfo> = {
  [ChainId.Bifrost]: {
    chainName: 'bifrost'
  },
  [ChainId.Moonriver]: {
    chainName: 'moonriver'
  },
  [ChainId.Moonbeam]: {
    chainName: 'moonbeam'
  },
}

const API_URL = 'https://api.zenlink.pro/rpc';

async function main() {
  const response = await axios.post(API_URL, {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "asset.get",
    "params": []
});

const allTokens: any[] = response.data.result || [];
const sdkTokens = allTokens.filter((item: any) => {
  return item.isNative === 'P' || item.isNative === 'N'
}).map((token) => {
  let networkId = null;
  const {chainId, assetType, assetIndex, symbol, decimals, name, account } = token;
  if(chainId === ChainId.Moonriver || chainId === ChainId.Bifrost) {
    networkId = NetworkId.Kusuma
  }
  if(chainId === ChainId.Moonbeam) {
    networkId = NetworkId.Polkadot
  }
  return {
    networkId: networkId,
    address: account,
    chainId: chainId,
    assetType,
    assetIndex,
    symbol,
    decimals,
    name,
  };
});
const tokensMap = sdkTokens.reduce((total: any, cur: any) => {
  if(!total[cur.chainId]) {
    total[cur.chainId] = [];
  }
  total[cur.chainId].push(cur);
  return total;
}, {} as Record<number, any[]>);



for  (const [chainId, tokens] of Object.entries(tokensMap)) {
  const chainInfo = ChainInfoMap[Number(chainId)];
  const result = {
    name: chainInfo.chainName,
    tokens: tokens
  }
  await writeFile(`tokens/${chainInfo.chainName}.json`, JSON.stringify(result, null, 2))
}
}
main();