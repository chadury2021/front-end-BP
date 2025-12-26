import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getVaultName } from './VaultFetchers';

export const useVaultDetailsData = () => {
  const { vaultAddress } = useParams();
  const [vaultData, setVaultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        const name = await getVaultName(vaultAddress);

        const hardcoded_data = {
          name,
          address: vaultAddress,
          description: `${name} is designed for investors looking to earn steady returns on their crypto assets with minimal hassle. The vault automatically allocates deposits into carefully selected strategies, optimizing for both yield and risk management.`,
          created: '2025-02-27',
          owner_id: 'ABC Curator',
          deposit_address: '04nd1f...fw25d',
          // Financial Data
          tvl: '$1,782,462.35',
          pnl: '$2,234.35',
          borrow_apy: '5.20%',
          deposit_apy: '8.02 %',
          lockup_period: '6 Month',
          max_loan_amount: '$1,256,353 USDT',
          total_borrowed: '$13.09M USDC',
          max_drawdown: '14%',
        };

        setVaultData(hardcoded_data);
      } catch (error) {
        console.error('Error fetching vault data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();
  }, [vaultAddress]);

  return { ...vaultData, loading };
};

export default useVaultDetailsData;
