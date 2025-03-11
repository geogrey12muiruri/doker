import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // Optionally verify token with auth-service
      fetch('http://localhost:3003/api/v1/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then(res => res.json())
        .then(data => {
          setUser(data.user); // Assuming /me returns { user: { id, username, role, ... } }
          setToken(storedToken);
        })
        .catch(() => {
          localStorage.removeItem('token'); // Invalid token, clear it
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password, institutionId) => {
    try {
      const response = await fetch('http://localhost:3003/api/v1/login', { // Use Nginx
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, institutionId }),
      });

      const data = await response.json();
      if (response.ok) {
        const { token, user } = data; // { token: "...", user: { id, username, role, ... } }
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        return user; // Return user object for login.js
      } else {
        console.error('Login failed:', data);
        return null;
      }
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const getRole = () => {
    return user ? user.role : null;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, getRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}