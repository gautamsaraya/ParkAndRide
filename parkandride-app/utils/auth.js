import AsyncStorage from '@react-native-async-storage/async-storage';

// Token management
export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('token');
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

// User data management
export const storeUserData = async (userData) => {
  try {
    const userDataString = JSON.stringify(userData);
    await AsyncStorage.setItem('userData', userDataString);
    
    // Store isAdmin flag separately for quick access
    if (userData.isAdmin !== undefined) {
      await AsyncStorage.setItem('isAdmin', userData.isAdmin ? 'true' : 'false');
    }
    
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

export const getUserData = async () => {
  try {
    const userDataString = await AsyncStorage.getItem('userData');
    if (userDataString) {
      return JSON.parse(userDataString);
    }
    return null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

export const isUserAdmin = async () => {
  try {
    const isAdmin = await AsyncStorage.getItem('isAdmin');
    return isAdmin === 'true';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('isAdmin');
    return true;
  } catch (error) {
    console.error('Error removing user data:', error);
    return false;
  }
};

// Complete logout function
export const logout = async () => {
  try {
    await removeToken();
    await removeUserData();
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};
