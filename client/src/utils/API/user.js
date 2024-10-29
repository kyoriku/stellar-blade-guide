const BASE_URL = import.meta.env.VITE_API_USER_URL;

// route to get logged in user's info (needs the token)
export const getMe = (token) => {
  return fetch(`${BASE_URL}/me`, {
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
  });
};

// route to create a new user
export const createUser = (userData) => {
  return fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
};

// route to login a user
export const loginUser = (userData) => {
  return fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
};