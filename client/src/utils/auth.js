// client/src/utils/auth.js
import decode from 'jwt-decode';

class AuthService {
getProfile() {
  const token = this.getToken();
  if (token) {
    try {
      const decoded = decode(token);
      return { data: decoded.data };
    } catch (err) {
      console.error('Error decoding token:', err);
      return null;
    }
  }
  return null;
}

  loggedIn() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token) {
    try {
      const decoded = decode(token);
      if (decoded.exp < Date.now() / 1000) {
        return true;
      } else return false;
    } catch (err) {
      return false;
    }
  }

  getToken() {
    return localStorage.getItem('id_token');
  }

  login(idToken, redirectUrl) {
    localStorage.setItem('id_token', idToken);
    if (redirectUrl) {
      window.location.assign(redirectUrl);
    } else {
      window.location.reload();
    }
  }

  logout() {
    localStorage.removeItem('id_token');
    localStorage.removeItem('userProfile');
    window.location.assign('/');
  }

  async updateProfile(profileData) {
    const token = this.getToken();
    if (token) {
      // Save the updated profile data in localStorage
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      
      // Get current profile to check if this update affects the current user
      const currentProfile = this.getProfile();
      
      // If this update is for the current user and their moderator status changed,
      // refresh their token
      if (currentProfile?.data?._id === profileData._id) {
        try {
          const response = await fetch('/api/users/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.getToken()}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to refresh token');
          }

          const data = await response.json();
          if (data.token) {
            // Update the token in localStorage
            localStorage.setItem('id_token', data.token);
            
            // Optional: If you want to ensure all permissions are properly updated,
            // you can refresh the page, but this might not be necessary if your
            // token refresh works correctly
            // window.location.reload();
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
          // Handle error appropriately - you might want to notify the user
          // or implement a retry mechanism
        }
      }
    }
  }

  // New method to explicitly refresh the token
  async refreshToken() {
    try {
      const response = await fetch('/api/users/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('id_token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }
}

export default new AuthService();