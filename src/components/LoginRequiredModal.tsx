import { useNavigate } from "react-router-dom";

interface LoginRequiredModalProps {
  onClose: () => void;
}

export default function LoginRequiredModal({ onClose }: LoginRequiredModalProps) {
  const navigate = useNavigate();

  return (
    // Full-screen dark overlay. Clicking outside the white box closes the modal.
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* stopPropagation prevents a click inside the box from bubbling up and closing the modal */}
      <div
        className="bg-white rounded-lg p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-2">Log in required</h2>
        <p className="text-gray-600 text-sm mb-4">
          You need to be logged in to do that. Log in or create an account to continue.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/login")}
            className="flex-1 bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="flex-1 border border-gray-300 rounded px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Sign Up
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-400 text-sm hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
