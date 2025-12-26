import React from 'react';
import { AccountsProvider } from '@/shared/context/AccountsProvider';
import ProofDetailsTable from './ProofDetailsTable';

export default function ProofDetailsPage() {
  return (
    <AccountsProvider>
      <ProofDetailsTable />
    </AccountsProvider>
  );
}
