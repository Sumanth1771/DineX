import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, {
  setAccessToken,
  clearAccessToken,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [
    accessToken,
    setAccessTokenState,
  ] = useState(null);

  const [loading, setLoading] = useState(true);

  /*
   * Restore the user's session when the application starts.
   *
   * The refresh token is stored in an HttpOnly cookie,
   * so JavaScript cannot directly access it.
   *
   * We ask the backend to issue a fresh access token.
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await api.post("/auth/refresh");

      const {
        accessToken: newAccessToken,
        user: refreshedUser,
      } = response.data.data;

      /*
       * Store the access token in React memory.
       */
      setAccessTokenState(newAccessToken);

      /*
       * Give the Axios client the token so
       * authenticated requests automatically
       * receive the Authorization header.
       */
      setAccessToken(newAccessToken);

      setUser(refreshedUser);

      return newAccessToken;
    } catch {
      setAccessTokenState(null);
      clearAccessToken();
      setUser(null);

      return null;
    }
  }, []);

  /*
   * Restore authentication when React starts.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      await refreshAccessToken();
      setLoading(false);
    };

    initializeAuth();
  }, [refreshAccessToken]);

  /*
   * Register a new customer.
   */
  const register = async (
    name,
    email,
    password
  ) => {
    const response = await api.post(
      "/auth/register",
      {
        name,
        email,
        password,
      }
    );

    const {
      accessToken: newAccessToken,
      user: newUser,
    } = response.data.data;

    /*
     * Store access token in React memory.
     */
    setAccessTokenState(newAccessToken);

    /*
     * Give token to Axios.
     */
    setAccessToken(newAccessToken);

    /*
     * Store logged-in user.
     */
    setUser(newUser);

    return newUser;
  };

  /*
   * Login existing user.
   */
  const login = async (
    email,
    password
  ) => {
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    const {
      accessToken: newAccessToken,
      user: loggedInUser,
    } = response.data.data;

    /*
     * Store access token in React memory.
     */
    setAccessTokenState(newAccessToken);

    /*
     * Give token to Axios.
     */
    setAccessToken(newAccessToken);

    /*
     * Store logged-in user.
     */
    setUser(loggedInUser);

    return loggedInUser;
  };

  /*
   * Logout the current user.
   */
  const logout = async () => {
    try {
      /*
       * Tell backend to revoke the refresh token.
       */
      await api.post("/auth/logout");
    } finally {
      /*
       * Clear everything locally even if
       * the backend request fails.
       */
      setAccessTokenState(null);

      clearAccessToken();

      setUser(null);
    }
  };

  /*
   * Everything exposed to components through useAuth().
   */
  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,

      isAuthenticated:
        Boolean(user && accessToken),

      register,
      login,
      logout,
      refreshAccessToken,
    }),
    [
      user,
      accessToken,
      loading,
      refreshAccessToken,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/*
 * Custom hook used by components
 * to access authentication state.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}