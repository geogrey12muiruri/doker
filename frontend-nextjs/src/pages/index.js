import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState('');
  const { login, user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, loading, router]);

  // Fetch institutions
  useEffect(() => {
    fetch(`http://localhost:3003/api/v1/institutions`)
      .then((res) => res.json())
      .then((data) => setInstitutions(data))
      .catch((err) => console.error('Failed to fetch institutions:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = await login(username, password, institutionId);
    if (!userData) {
      setError('Login failed. Please check your credentials or verify your email.');
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const response = await fetch(`http://localhost:3003/api/v1/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, institutionId }),
      });

      if (response.ok) {
        setError('Verification email resent. Please check your inbox.');
      } else {
        const data = await response.json();
        setError(`Failed to resend verification email: ${data.error}`);
      }
    } catch (error) {
      setError('Error resending verification email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Login
        </h1>
        {error && (
          <div className="mb-4 text-red-600 text-center">
            {error}
            {error.includes('verify your email') && (
              <button
                onClick={resendVerificationEmail}
                className="ml-2 text-blue-600 underline"
              >
                Resend Verification Email
              </button>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Institution</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-200 font-medium"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}