import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoginRequiredModal from "./LoginRequiredModal";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface AddCourseProps {
  // the department the new course will belong to
  departmentId: string;
  // called with the newly created course, so a parent form (like AddProfessor)
  // can immediately select it without the user having to search for it again
  onCourseCreated: (course: Course) => void;
}

export default function AddCourse({ departmentId, onCourseCreated }: AddCourseProps) {
  const { user, token } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!user) {
      setShowModal(true);
    } else {
      setShowForm(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:3000/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, name, departmentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create course");
      }

      onCourseCreated(data); // hand the newly created course back to the parent
      setCode("");
      setName("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {!showForm && (
        <button
          type="button"
          onClick={handleClick}
          disabled={!departmentId}
          className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
          title={!departmentId ? "Pick a department first" : undefined}
        >
          + Add new course
        </button>
      )}

      {showModal && <LoginRequiredModal onClose={() => setShowModal(false)} />}

      {showForm && (
        <div className="border border-gray-200 rounded p-3 mt-2">
          {error && (
            <p className="bg-red-50 text-red-600 text-xs rounded px-2 py-1 mb-2">{error}</p>
          )}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Code (e.g. CS 301)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="Name (e.g. Algorithms)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 text-white rounded px-3 py-1 text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Course"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
