import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserMetadata } from '../shared/context/UserMetadataProvider';

function AgreementGatedRoute() {
  const { isRetail, betaAgreedAt } = useUserMetadata();

  return isRetail && !betaAgreedAt ? <Navigate to='/beta_agreement' /> : <Outlet />;
}

export default AgreementGatedRoute;
