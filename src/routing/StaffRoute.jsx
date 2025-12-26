import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';

function StaffRoute() {
  const { user } = useUserMetadata();
  const isStaff = !!(user && (user.is_staff || user.is_superuser));
  return isStaff ? <Outlet /> : <Navigate to='/' />;
}

export default StaffRoute;
