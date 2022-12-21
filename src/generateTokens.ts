import axios from "axios";
import { writeFile, readdir, mkdir } from 'node:fs/promises';
import { ApiToken, ChainId, ChainName, Native, NetworkId, SdkToken } from "./types";

const CHAINID_TO_NETWORKID = (id: ChainId): NetworkId => {
  switch (id) {
    case ChainId.BIFROST_KUSAMA:
      return NetworkId.KUSAMA
    case ChainId.BIFROST_POLKADOT:
      return NetworkId.POLKADOT
    case ChainId.MOONRIVER:
      return NetworkId.KUSAMA
    case ChainId.MOONBEAM:
      return NetworkId.POLKADOT
    case ChainId.ASTAR:
      return NetworkId.POLKADOT
    default:
      throw new Error(`Unknown chain id: ${id}`);
  }
}

const CHAINID_TO_CHAINNAME = (id: ChainId): ChainName => {
  switch (id) {
    case ChainId.BIFROST_KUSAMA:
      return ChainName.BIFROST_KUSAMA
    case ChainId.BIFROST_POLKADOT:
      return ChainName.BIFROST_POLKADOT
    case ChainId.MOONBEAM:
      return ChainName.MOONBEAM
    case ChainId.ASTAR:
      return ChainName.ASTAR
    case ChainId.MOONRIVER:
      return ChainName.MOONRIVER
    default:
      throw new Error(`Unknown chain id: ${id}`);
  }
}

const API_URL = 'https://api.zenlink.pro/rpc';

async function main() {
  const response = await axios.post(API_URL, {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "asset.get",
    "params": []
  });
  const allTokens: ApiToken[] = response.data.result || [];
  const sdkTokens: SdkToken[] = allTokens
    .filter((token) => token.isNative === Native.P || token.isNative === Native.N)
    .map((token) => {
      let networkId = null;
      const { chainId, assetType, assetIndex, symbol, decimals, name, account } = token;
      networkId = CHAINID_TO_NETWORKID(chainId)

      return {
        networkId,
        address: account,
        chainId,
        assetType,
        assetIndex,
        symbol,
        decimals,
        name,
      };
    });

  const tokensMap = sdkTokens.reduce<Record<number, SdkToken[]>>(
    (map, token) => {
      if (!map[token.chainId]) {
        map[token.chainId] = [];
      }
      map[token.chainId].push(token);
      return map;
    }, {});

  await readdir('tokens').catch(
    async () => { await mkdir('tokens') }
  )

  for (const [chainId, tokens] of Object.entries(tokensMap)) {
    const chainName = CHAINID_TO_CHAINNAME(Number(chainId));
    const tokenlistInfo = {
      name: chainName,
      tokens: tokens
    }
    await writeFile(`tokens/${chainName}.json`, JSON.stringify(tokenlistInfo, null, 2))
  }
}

main();
