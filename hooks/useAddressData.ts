import { useState, useCallback } from 'react';
import { AddressData, fetchAddressData } from '../lib/addressLookup';
import {
  TokenHolding,
  NftHolding,
  fetchTokenHoldings,
  fetchNftHoldings,
} from '../lib/tokenHoldings';

interface UseAddressDataReturn {
  data:           AddressData | null;
  tokens:         TokenHolding[];
  nfts:           NftHolding[];
  loading:        boolean;
  loadingHoldings: boolean;
  error:          string | null;
  search:         (address: string) => Promise<void>;
  reset:          () => void;
}

export function useAddressData(): UseAddressDataReturn {
  const [data,            setData]            = useState<AddressData | null>(null);
  const [tokens,          setTokens]          = useState<TokenHolding[]>([]);
  const [nfts,            setNfts]            = useState<NftHolding[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [loadingHoldings, setLoadingHoldings] = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const search = useCallback(async (address: string) => {
    const addr = address.trim();
    if (!addr) return;

    setLoading(true);
    setError(null);
    setData(null);
    setTokens([]);
    setNfts([]);

    try {
      // 1. Fetch base address data (balance, txs)
      const result = await fetchAddressData(addr);
      setData(result);
      setLoading(false);

      // 2. Fetch holdings in background
      setLoadingHoldings(true);
      const network = result.addressType === 'btc-mainnet' ? 'btc-mainnet' : 'opnet-testnet';

      // Use contract addresses discovered from the address's tx history
      const txContracts = result.rawContracts;

      const [tokenResults, nftResults] = await Promise.allSettled([
        fetchTokenHoldings(network, addr, txContracts),
        fetchNftHoldings(network, addr, txContracts),
      ]);

      setTokens(tokenResults.status === 'fulfilled' ? tokenResults.value : []);
      setNfts(nftResults.status   === 'fulfilled' ? nftResults.value   : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch address data');
    } finally {
      setLoading(false);
      setLoadingHoldings(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setTokens([]);
    setNfts([]);
    setError(null);
    setLoading(false);
    setLoadingHoldings(false);
  }, []);

  return { data, tokens, nfts, loading, loadingHoldings, error, search, reset };
}
