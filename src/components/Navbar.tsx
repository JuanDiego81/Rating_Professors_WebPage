import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <Link to="/" className="text-lg font-bold">
        RateMyProf
      </Link>

      <div className="flex items-center gap-4 text-sm font-medium">
        {user ? (
          <>
            <span className="text-gray-600">{user.email}</span>
            <button onClick={handleLogout} className="hover:text-blue-600">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-blue-600">
              Log In
            </Link>
            <Link to="/signup" className="hover:text-blue-600">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
