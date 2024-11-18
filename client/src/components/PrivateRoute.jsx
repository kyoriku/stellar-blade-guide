import { Navigate } from 'react-router-dom';
import Auth from '../utils/auth';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const isAuthenticated = Auth.loggedIn();
  const user = Auth.getProfile()?.data;
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (adminOnly && !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default PrivateRoute;