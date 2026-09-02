import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AddProfessor from "../components/AddProfessor";

// Shapes matching what GET /university/:id returns (nested departments -> professors)
interface Professor {
  id: string;
  name: string;
  departmentId: string;
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

  // Which department ids are currently checked in the filter panel.
  // Starts empty, meaning "no filter applied, show everyone".
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);

  // Pulled into its own function so AddProfessor can call this again after
  // successfully creating a professor, refreshing the list.
  function fetchUniversity() {
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
  }

  useEffect(() => {
    fetchUniversity();
    // re-run this fetch if the id in the URL ever changes (e.g. navigating between two university pages)
  }, [id]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading university...</div>;
  }

  if (error || !university) {
    return <div className="p-8 text-red-500">{error ?? "University not found."}</div>;
  }

  // Flatten departments -> professors into one flat list, with department name
  // attached to each professor as a badge. This matches the "professors first,
  // department as a label" approach you wanted, instead of a department-first hierarchy.
  const allProfessors = university.departments.flatMap((department) =>
    department.professors.map((professor) => ({
      ...professor,
      departmentName: department.name,
    }))
  );

  // Toggles a department id in/out of the selectedDepartmentIds array when its checkbox is clicked
  function toggleDepartment(departmentId: string) {
    setSelectedDepartmentIds((prev) =>
      prev.includes(departmentId)
        ? prev.filter((id) => id !== departmentId) // uncheck: remove it
        : [...prev, departmentId] // check: add it
    );
  }

  // If no departments are selected, show everyone. Otherwise, only show professors
  // whose departmentId is in the selected list.
  const filteredProfessors =
    selectedDepartmentIds.length === 0
      ? allProfessors
      : allProfessors.filter((professor) =>
          selectedDepartmentIds.includes(professor.departmentId)
        );

  return (
    <div className="flex min-h-screen">
      {/* Left filter panel - department checkboxes */}
      <aside className="w-64 border-r border-gray-200 p-4">
        <h2 className="font-semibold mb-3">Departments</h2>
        <div className="flex flex-col gap-2">
          {university.departments.map((department) => (
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
      </aside>

      {/* Main area - professor list */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-1">{university.name}</h1>
        <p className="text-gray-500 mb-4">{filteredProfessors.length} professors</p>

        <AddProfessor
          universityId={university.id}
          departments={university.departments}
          onProfessorCreated={fetchUniversity}
        />

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
