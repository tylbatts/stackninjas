import { useKeycloak } from '@react-keycloak/web';
import { Navigate } from 'react-router-dom';
export default function Login() {
  const { keycloak, initialized } = useKeycloak();
  // If already authenticated, redirect to dashboard
  if (initialized && keycloak.authenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Sign In to StackNinjas
          </h1>
          <button
            onClick={() => keycloak.login()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow transition duration-300"
          >
            Login with Keycloak
          </button>
        </div>
      </div>
    );
  }
  