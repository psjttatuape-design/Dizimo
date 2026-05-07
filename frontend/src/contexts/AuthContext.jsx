import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";

import { API } from "../lib/api";
import { tokenStorage } from "../lib/tokenStorage";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => tokenStorage.get());
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      tokenStorage.clear();
      setToken(null);
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (username, password) => {
    const response = await axios.post(`${API}/auth/login`, { username, password });
    const { access_token, user: userData } = response.data;
    tokenStorage.set(access_token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    tokenStorage.clear();
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  const hasPermission = (resource, action) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions?.[`${resource}_${action}`] || false;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasPermission, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
