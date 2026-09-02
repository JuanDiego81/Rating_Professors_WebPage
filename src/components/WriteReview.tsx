import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LoginRequiredModal from "./LoginRequiredModal";
import AddCourse from "./AddCourse";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Tag {
  id: string;
  label: string;
}

interface WriteReviewProps {
  professorId: string;
  departmentId: string;
  courses: Course[];
  // called after a successful submission, so the parent page can refresh its review list
  onReviewCreated: () => void;
  // called after a course is linked to this professor, so the parent page can refetch
  onCourseAdded: () => void;
}

export default function WriteReview({
  professorId,
  departmentId,
  courses,
  onReviewCreated,
  onCourseAdded,
}: WriteReviewProps) {
  const { user, token } = useAuth();

  const [showModal, setShowModal] = useState(false); // controls the LoginRequiredModal
  const [showForm, setShowForm] = useState(false); // controls whether the actual form is expanded

  const [allTags, setAllTags] = useState<Tag[]>([]);

  // Form field state
  const [courseId, setCourseId] = useState("");
  const [qualityRating, setQualityRating] = useState(5);
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [wouldTakeAgain, setWouldTakeAgain] = useState<boolean | null>(null);
  const [gradeReceived, setGradeReceived] = useState("");
  const [gradeNotDisclosed, setGradeNotDisclosed] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Add a course" mini-panel - lets the user link a course this professor
  // teaches that isn't in the dropdown yet
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [departmentCourses, setDepartmentCourses] = useState<Course[]>([]);
  const [existingCourseId, setExistingCourseId] = useState("");
  const [linkingCourse, setLinkingCourse] = useState(false);
  const [addCourseError, setAddCourseError] = useState<string | null>(null);

  // Fetch the full list of tags once, so we can show them as checkboxes
  useEffect(() => {
    fetch("http://localhost:3000/tags")
      .then((res) => res.json())
      .then((data) => setAllTags(data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch this department's courses when the add-course panel opens, so we can
  // offer the ones this professor isn't linked to yet
  useEffect(() => {
    if (!showAddCourse) return;

    fetch(`http://localhost:3000/courses?departmentId=${departmentId}`)
      .then((res) => res.json())
      .then((data) => setDepartmentCourses(data))
      .catch((err) => console.error(err));
  }, [showAddCourse, departmentId]);

  async function linkCourseToProfessor(courseId: string) {
    setAddCourseError(null);
    setLinkingCourse(true);

    try {
      const res = await fetch(`http://localhost:3000/professors/${professorId}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add course");
      }

      setCourseId(courseId); // preselect the newly linked course in the review form
      setExistingCourseId("");
      setShowAddCourse(false);
      onCourseAdded(); // tell the parent page to refetch, so the course shows up everywhere
    } catch (err) {
      setAddCourseError(err instanceof Error ? err.message : "Failed to add course");
    } finally {
      setLinkingCourse(false);
    }
  }

  function handleWriteReviewClick() {
    if (!user) {
      setShowModal(true);
    } else {
      setShowForm(true);
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!courseId) {
      setError("Please select a course");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:3000/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          professorId,
          courseId,
          qualityRating,
          difficultyRating,
          wouldTakeAgain,
          gradeReceived: gradeNotDisclosed ? null : gradeReceived || null,
          comment,
          tagIds: selectedTagIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Reset the form and collapse it back down
      setCourseId("");
      setQualityRating(5);
      setDifficultyRating(3);
      setWouldTakeAgain(null);
      setGradeReceived("");
      setGradeNotDisclosed(false);
      setComment("");
      setSelectedTagIds([]);
      setShowForm(false);

      onReviewCreated(); // tell the parent page to refetch, so the new review shows up
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-8">
      {!showForm && (
        <button
          onClick={handleWriteReviewClick}
          className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Write a Review
        </button>
      )}

      {showModal && <LoginRequiredModal onClose={() => setShowModal(false)} />}

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-6 mt-4">
          <h2 className="text-lg font-bold mb-4">Write a Review</h2>

          {error && (
            <p className="bg-red-50 text-red-600 text-sm rounded px-3 py-2 mb-4">{error}</p>
          )}

          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm"
          >
            <option value="">Select a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>

          {!showAddCourse ? (
            <button
              type="button"
              onClick={() => setShowAddCourse(true)}
              className="text-sm text-blue-600 hover:underline mb-4"
            >
              + Don't see the course? Add it
            </button>
          ) : (
            <div className="border border-gray-200 rounded p-3 mb-4">
              {addCourseError && (
                <p className="bg-red-50 text-red-600 text-xs rounded px-2 py-1 mb-2">
                  {addCourseError}
                </p>
              )}

              {departmentCourses.filter((c) => !courses.some((pc) => pc.id === c.id)).length > 0 && (
                <div className="flex gap-2 mb-2">
                  <select
                    value={existingCourseId}
                    onChange={(e) => setExistingCourseId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Select an existing course...</option>
                    {departmentCourses
                      .filter((c) => !courses.some((pc) => pc.id === c.id))
                      .map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => linkCourseToProfessor(existingCourseId)}
                    disabled={!existingCourseId || linkingCourse}
                    className="border border-gray-300 rounded px-3 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}

              <AddCourse
                departmentId={departmentId}
                onCourseCreated={(course) => linkCourseToProfessor(course.id)}
              />

              <button
                type="button"
                onClick={() => setShowAddCourse(false)}
                className="block text-xs text-gray-500 hover:text-gray-700 mt-2"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quality (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={qualityRating}
                onChange={(e) => setQualityRating(Number(e.target.value))}
                className="w-20 border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={difficultyRating}
                onChange={(e) => setDifficultyRating(Number(e.target.value))}
                className="w-20 border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="block text-sm font-medium mb-1">Would you take this professor again?</label>
          <div className="flex gap-4 mb-4 text-sm">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="wouldTakeAgain"
                checked={wouldTakeAgain === true}
                onChange={() => setWouldTakeAgain(true)}
              />
              Yes
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="wouldTakeAgain"
                checked={wouldTakeAgain === false}
                onChange={() => setWouldTakeAgain(false)}
              />
              No
            </label>
          </div>

          <label className="block text-sm font-medium mb-1">Grade Received</label>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="e.g. A-"
              value={gradeReceived}
              onChange={(e) => setGradeReceived(e.target.value)}
              disabled={gradeNotDisclosed}
              className="border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100"
            />
            <label className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={gradeNotDisclosed}
                onChange={(e) => setGradeNotDisclosed(e.target.checked)}
              />
              Prefer not to say
            </label>
          </div>
        

          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {allTags.map((tag) => (
              <label
                key={tag.id}
                className={`text-xs rounded-full px-3 py-1 border cursor-pointer ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                />
                {tag.label}
              </label>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-sm"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
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
