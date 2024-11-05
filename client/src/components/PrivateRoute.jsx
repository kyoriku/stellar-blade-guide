import { Navigate } from 'react-router-dom';
import Auth from '../utils/auth';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = Auth.loggedIn();
  const user = Auth.getProfile()?.data;
  
  // Check if user is authenticated and is kyoriku
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (user?.username !== 'kyoriku') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default PrivateRoute;