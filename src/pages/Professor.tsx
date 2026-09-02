import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import WriteReview from "../components/WriteReview";
import LoginRequiredModal from "../components/LoginRequiredModal";
import { useAuth } from "../context/AuthContext";

// Shapes matching what GET /professors/:id returns
interface Course {
  id: string;
  code: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  label: string;
}

interface Vote {
  id: string;
  value: number;
  userId: string;
}

interface Review {
  id: string;
  qualityRating: number;
  difficultyRating: number;
  wouldTakeAgain: boolean | null;
  gradeReceived: string | null;
  comment: string;
  courseId: string;
  course: Course;
  tags: Tag[];
  votes: Vote[];
}

interface ProfessorDetail {
  id: string;
  name: string;
  department: Department;
  courses: Course[];
  reviews: Review[];
  reviewCount: number;
  averageQuality: number | null;
  averageDifficulty: number | null;
}

export default function Professor() {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [professor, setProfessor] = useState<ProfessorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which course ids are checked in the filter panel. Empty = show reviews from all courses.
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Shows the login modal when a logged-out user tries to vote
  const [showVoteLoginModal, setShowVoteLoginModal] = useState(false);
  // Id of the review currently being voted on, so we can disable just that review's buttons
  const [votingReviewId, setVotingReviewId] = useState<string | null>(null);

  // Pulled out into its own function (not just inline in useEffect) so WriteReview
  // can call this same fetch again after a successful submission, refreshing the list.
  function fetchProfessor() {
    fetch(`http://localhost:3000/professors/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch professor");
        }
        return res.json();
      })
      .then((data) => {
        setProfessor(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load this professor.");
        setLoading(false);
      });
  }

  // Run the fetch once when the page loads, and again whenever the id in the URL changes
  useEffect(() => {
    fetchProfessor();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading professor...</div>;
  }

  if (error || !professor) {
    return <div className="p-8 text-red-500">{error ?? "Professor not found."}</div>;
  }

  function toggleCourse(courseId: string) {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }

  async function handleVote(reviewId: string, value: 1 | -1) {
    if (!user) {
      setShowVoteLoginModal(true);
      return;
    }

    setVotingReviewId(reviewId);

    try {
      const res = await fetch(`http://localhost:3000/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value }),
      });

      if (!res.ok) {
        throw new Error("Failed to vote");
      }

      fetchProfessor(); // refetch so the updated vote counts show up
    } catch (err) {
      console.error(err);
    } finally {
      setVotingReviewId(null);
    }
  }

  const filteredReviews =
    selectedCourseIds.length === 0
      ? professor.reviews
      : professor.reviews.filter((review) => selectedCourseIds.includes(review.courseId));

  // Small helper so we don't repeat this ternary everywhere - shows "N/A" instead of a raw null/NaN
  function formatRating(value: number | null) {
    return value === null ? "N/A" : value.toFixed(1);
  }

  return (
    <div className="flex min-h-screen">
      {showVoteLoginModal && (
        <LoginRequiredModal onClose={() => setShowVoteLoginModal(false)} />
      )}

      {/* Left filter panel - course checkboxes */}
      <aside className="w-64 border-r border-gray-200 p-4">
        <h2 className="font-semibold mb-3">Courses</h2>
        <div className="flex flex-col gap-2">
          {professor.courses.map((course) => (
            <label key={course.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCourseIds.includes(course.id)}
                onChange={() => toggleCourse(course.id)}
              />
              {course.code}
            </label>
          ))}
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold">{professor.name}</h1>
        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1">
          {professor.department.name}
        </span>

        {/* Average ratings summary */}
        <div className="flex gap-8 mt-6 mb-8">
          <div>
            <p className="text-2xl font-bold">{formatRating(professor.averageQuality)}</p>
            <p className="text-sm text-gray-500">Quality</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatRating(professor.averageDifficulty)}</p>
            <p className="text-sm text-gray-500">Difficulty</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{professor.reviewCount}</p>
            <p className="text-sm text-gray-500">Reviews</p>
          </div>
        </div>

        {/* Write a review - shows login modal if not logged in */}
        <WriteReview
          professorId={professor.id}
          departmentId={professor.department.id}
          courses={professor.courses}
          onReviewCreated={fetchProfessor}
          onCourseAdded={fetchProfessor}
        />

        {/* Reviews list */}
        {filteredReviews.length === 0 ? (
          <p className="text-gray-500">No reviews match this filter.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredReviews.map((review) => {
              const upvotes = review.votes.filter((v) => v.value === 1).length;
              const downvotes = review.votes.filter((v) => v.value === -1).length;
              const myVote = review.votes.find((v) => v.userId === user?.id)?.value ?? null;
              const isVoting = votingReviewId === review.id;

              return (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {review.course.code}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleVote(review.id, 1)}
                        disabled={isVoting}
                        className={`rounded px-1.5 py-0.5 disabled:opacity-50 ${
                          myVote === 1 ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        👍 {upvotes}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVote(review.id, -1)}
                        disabled={isVoting}
                        className={`rounded px-1.5 py-0.5 disabled:opacity-50 ${
                          myVote === -1 ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        👎 {downvotes}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-6 mb-2 text-sm">
                    <span>
                      Quality: <strong>{review.qualityRating}/5</strong>
                    </span>
                    <span>
                      Difficulty: <strong>{review.difficultyRating}/5</strong>
                    </span>
                    {review.wouldTakeAgain !== null && (
                      <span>
                        Would take again:{" "}
                        <strong>{review.wouldTakeAgain ? "Yes" : "No"}</strong>
                      </span>
                    )}
                    <span>
                      Grade: <strong>{review.gradeReceived ?? "Not disclosed"}</strong>
                    </span>
                  </div>

                  {review.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-2">
                      {review.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-1"
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-gray-800">{review.comment}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
