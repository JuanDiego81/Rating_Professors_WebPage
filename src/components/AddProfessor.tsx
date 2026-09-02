import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LoginRequiredModal from "./LoginRequiredModal";
import AddCourse from "./AddCourse";

interface Department {
  id: string;
  name: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
}

interface AddProfessorProps {
  universityId: string;
  departments: Department[];
  // called after a successful creation, so the parent University page can refetch
  onProfessorCreated: () => void;
}

export default function AddProfessor({ departments, onProfessorCreated }: AddProfessorProps) {
  const { user, token } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  // Courses the user has picked (or just created) to link to this new professor.
  // Newly created courses get added here directly via AddCourse's callback.
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);

  // Courses that already exist in the chosen department, so the user can pick
  // one instead of accidentally trying to create a duplicate
  const [existingCourses, setExistingCourses] = useState<Course[]>([]);
  const [existingCourseId, setExistingCourseId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refetch the course list scoped to the department every time it changes,
  // and drop any picked courses that no longer belong to the new department
  useEffect(() => {
    setSelectedCourses([]);
    setExistingCourseId("");

    if (!departmentId) {
      setExistingCourses([]);
      return;
    }

    fetch(`http://localhost:3000/courses?departmentId=${departmentId}`)
      .then((res) => res.json())
      .then((data) => setExistingCourses(data))
      .catch((err) => console.error(err));
  }, [departmentId]);

  function handleClick() {
    if (!user) {
      setShowModal(true);
    } else {
      setShowForm(true);
    }
  }

  function handleCourseCreated(course: Course) {
    // avoid adding the same course twice if clicked more than once
    setSelectedCourses((prev) =>
      prev.some((c) => c.id === course.id) ? prev : [...prev, course]
    );
  }

  function addExistingCourse() {
    const course = existingCourses.find((c) => c.id === existingCourseId);
    if (!course) return;

    setSelectedCourses((prev) =>
      prev.some((c) => c.id === course.id) ? prev : [...prev, course]
    );
    setExistingCourseId("");
  }

  function removeCourse(courseId: string) {
    setSelectedCourses((prev) => prev.filter((c) => c.id !== courseId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!departmentId) {
      setError("Please select a department");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:3000/professors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          departmentId,
          courseIds: selectedCourses.map((c) => c.id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create professor");
      }

      // Reset everything and collapse the form
      setName("");
      setDepartmentId("");
      setSelectedCourses([]);
      setShowForm(false);

      onProfessorCreated(); // tell the University page to refetch its professor list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create professor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6">
      {!showForm && (
        <button
          onClick={handleClick}
          className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Add Professor
        </button>
      )}

      {showModal && <LoginRequiredModal onClose={() => setShowModal(false)} />}

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 mt-2 max-w-md">
          <h3 className="font-semibold mb-3">Add a Professor</h3>

          {error && (
            <p className="bg-red-50 text-red-600 text-sm rounded px-3 py-2 mb-3">{error}</p>
          )}

          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            placeholder="e.g. Dr. Rivera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm"
          />

          <label className="block text-sm font-medium mb-1">Department</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm"
          >
            <option value="">Select a department...</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1">Courses (optional)</label>

          {selectedCourses.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedCourses.map((course) => (
                <span
                  key={course.id}
                  className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-1 flex items-center gap-1"
                >
                  {course.code}
                  <button
                    type="button"
                    onClick={() => removeCourse(course.id)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {departmentId && existingCourses.length > 0 && (
            <div className="flex gap-2 mb-2">
              <select
                value={existingCourseId}
                onChange={(e) => setExistingCourseId(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="">Select an existing course...</option>
                {existingCourses
                  .filter((c) => !selectedCourses.some((sc) => sc.id === c.id))
                  .map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={addExistingCourse}
                disabled={!existingCourseId}
                className="border border-gray-300 rounded px-3 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}

          <div className="mb-4">
            <AddCourse departmentId={departmentId} onCourseCreated={handleCourseCreated} />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Professor"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-gray-300 rounded px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
