import { Navigate, Outlet } from 'react-router-dom';

function PrivateRoute({ isAuthenticated }) {
  return isAuthenticated ? <Outlet /> : <Navigate to='/' />;
}

export default PrivateRoute;
