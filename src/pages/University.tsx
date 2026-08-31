import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Shapes matching what GET /university/:id returns (nested departments -> professors -> courses)
interface Course {
  id: string;
  code: string;
  name: string;
}

interface Professor {
  id: string;
  name: string;
  departmentId: string;
  courses: Course[];
}

interface Department {
  id: string;
  name: string;
  professors: Professor[];
}

interface UniversityDetail {
  id: string;
  name: string;
  departments: Department[];
}

export default function University() {
  // id of the university, captured from the URL (e.g. /university/abc123 -> "abc123")
  const { id } = useParams();
  const navigate = useNavigate();

  const [university, setUniversity] = useState<UniversityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which department/course ids are currently checked in the filter panels.
  // Starts empty, meaning "no filter applied, show everyone".
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // What the user has typed into each filter panel's search box
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");

  useEffect(() => {
    fetch(`http://localhost:3000/university/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch university");
        }
        return res.json();
      })
      .then((data) => {
        setUniversity(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load this university.");
        setLoading(false);
      });
    // re-run this fetch if the id in the URL ever changes (e.g. navigating between two university pages)
  }, [id]);

  // Flatten departments -> professors into one flat list, with department name
  // attached to each professor as a badge. This matches the "professors first,
  // department as a label" approach you wanted, instead of a department-first hierarchy.
  const allProfessors = university
    ? university.departments.flatMap((department) =>
        department.professors.map((professor) => ({
          ...professor,
          departmentName: department.name,
        }))
      )
    : [];

  // Every unique course taught by any professor at this university, for the courses filter panel.
  const allCourses = university
    ? Array.from(
        new Map(
          allProfessors.flatMap((professor) => professor.courses).map((course) => [course.id, course])
        ).values()
      )
    : [];

  // Departments and courses narrow each other down: picking a course only shows the
  // departments that teach it, and picking a department only shows the courses taught there.
  const visibleDepartments = university
    ? university.departments.filter(
        (department) =>
          selectedCourseIds.length === 0 ||
          department.professors.some((professor) =>
            professor.courses.some((course) => selectedCourseIds.includes(course.id))
          )
      )
    : [];

  const visibleCourses = allCourses.filter(
    (course) =>
      selectedDepartmentIds.length === 0 ||
      allProfessors.some(
        (professor) =>
          selectedDepartmentIds.includes(professor.departmentId) &&
          professor.courses.some((c) => c.id === course.id)
      )
  );

  // Narrow each panel's list further by whatever's typed in its search box.
  // Kept separate from visibleDepartments/visibleCourses so the cross-filtering
  // logic above (and the sync effects below) stay based on the real selection state.
  const searchedDepartments = visibleDepartments.filter((department) =>
    department.name.toLowerCase().includes(departmentSearchTerm.toLowerCase())
  );
  const searchedCourses = visibleCourses.filter((course) =>
    course.code.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  // Whenever the department filter changes, drop any selected course that no longer
  // belongs to a visible department (so the two filters never end up out of sync).
  useEffect(() => {
    setSelectedCourseIds((prev) => {
      const visibleIds = new Set(visibleCourses.map((course) => course.id));
      const next = prev.filter((courseId) => visibleIds.has(courseId));
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartmentIds, university]);

  // Whenever the course filter changes, drop any selected department that no longer
  // has a professor teaching one of the selected courses.
  useEffect(() => {
    setSelectedDepartmentIds((prev) => {
      const visibleIds = new Set(visibleDepartments.map((department) => department.id));
      const next = prev.filter((departmentId) => visibleIds.has(departmentId));
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseIds, university]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading university...</div>;
  }

  if (error || !university) {
    return <div className="p-8 text-red-500">{error ?? "University not found."}</div>;
  }

  // Toggles a department id in/out of the selectedDepartmentIds array when its checkbox is clicked
  function toggleDepartment(departmentId: string) {
    setSelectedDepartmentIds((prev) =>
      prev.includes(departmentId)
        ? prev.filter((id) => id !== departmentId) // uncheck: remove it
        : [...prev, departmentId] // check: add it
    );
  }

  // Toggles a course id in/out of the selectedCourseIds array when its checkbox is clicked
  function toggleCourse(courseId: string) {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }

  // Only show professors matching both the department filter and the course filter.
  const filteredProfessors = allProfessors.filter((professor) => {
    const matchesDepartment =
      selectedDepartmentIds.length === 0 || selectedDepartmentIds.includes(professor.departmentId);
    const matchesCourse =
      selectedCourseIds.length === 0 ||
      professor.courses.some((course) => selectedCourseIds.includes(course.id));
    return matchesDepartment && matchesCourse;
  });

  return (
    <div className="flex min-h-screen">
      {/* Left filter panels - department and course checkboxes */}
      <aside className="w-64 mt-9 ml-4 flex flex-col gap-4 self-start">
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Departments</h2>
          <input
            type="text"
            placeholder="Search departments..."
            value={departmentSearchTerm}
            onChange={(e) => setDepartmentSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
          />
          <div className="flex flex-col gap-2">
            {searchedDepartments.map((department) => (
              <label key={department.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedDepartmentIds.includes(department.id)}
                  onChange={() => toggleDepartment(department.id)}
                />
                {department.name}
              </label>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Courses</h2>
          <input
            type="text"
            placeholder="Search courses..."
            value={courseSearchTerm}
            onChange={(e) => setCourseSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
          />
          <div className="flex flex-col gap-2">
            {searchedCourses.map((course) => (
              <label key={course.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCourseIds.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                />
                {course.code}
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main area - professor list */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-1">{university.name}</h1>
        <p className="text-gray-500 mb-6">{filteredProfessors.length} professors</p>

        {filteredProfessors.length === 0 ? (
          <p className="text-gray-500">No professors match this filter.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredProfessors.map((professor) => (
              <button
                key={professor.id}
                onClick={() => navigate(`/professor/${professor.id}`)}
                className="text-left border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-400 transition"
              >
                <p className="font-semibold">{professor.name}</p>
                <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1">
                  {professor.departmentName}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
