import decode from 'jwt-decode';

class AuthService {
  // get user data from the token and profile data in localStorage
  getProfile() {
    const token = this.getToken();
    if (token) {
      const decodedToken = decode(token); // Decode the token
      const profileData = JSON.parse(localStorage.getItem('userProfile')) || {}; // Retrieve profile from localStorage
      return { ...decodedToken, ...profileData }; // Combine the token and profile data
    }
    return null; // Return null if no token is found
  }

  // check if user's logged in
  loggedIn() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token); // Check if token exists and is valid
  }

  // check if token is expired
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

  // get token from localStorage
  getToken() {
    return localStorage.getItem('id_token');
  }

  // login and store the token in localStorage
  login(idToken, redirectUrl) {
    localStorage.setItem('id_token', idToken);
    if (redirectUrl) {
      window.location.assign(redirectUrl);
    } else {
      window.location.reload();
    }
  }

  // logout and remove token and profile data from localStorage
  logout() {
    localStorage.removeItem('id_token');
    localStorage.removeItem('userProfile');
    window.location.assign('/');
  }

  // update user profile and store it in localStorage
  // updateProfile(profileData) {
  //   const token = this.getToken();
  //   if (token) {
  //     // Save the updated profile data in localStorage
  //     localStorage.setItem('userProfile', JSON.stringify(profileData));
  //   }
  // }
  updateProfile(profileData) {
    const token = this.getToken();
    if (token) {
      // Save the updated profile data in localStorage
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      
      // If the current user's moderator status changed, refresh the page
      const currentProfile = this.getProfile();
      // if (currentProfile?.data?._id === profileData._id && 
      //     currentProfile?.data?.isModerator !== profileData.isModerator) {
      //   window.location.reload();
      // }
    }
  }
}

export default new AuthService();
