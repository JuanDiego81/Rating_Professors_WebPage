import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Shape of a university object as returned by GET /university
interface University {
  id: string;
  name: string;
}

export default function Home() {
  // Holds the full list of universities fetched from the backend
  const [universities, setUniversities] = useState<University[]>([]);

  // Holds whatever the user has typed into the search box
  const [searchTerm, setSearchTerm] = useState("");

  // Tracks whether the fetch is still in progress, so we can show a loading message
  const [loading, setLoading] = useState(true);

  // Tracks any error that happened while fetching, so we can show a message instead of a blank page
  const [error, setError] = useState<string | null>(null);

  // lets us navigate to another page programmatically (e.g. after clicking a university)
  const navigate = useNavigate();

  // useEffect with an empty dependency array ([]) runs once, right when this component first loads -
  // this is where we kick off the fetch to our backend
  useEffect(() => {
    fetch("http://localhost:3000/university")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch universities");
        }
        return res.json();
      })
      .then((data) => {
        setUniversities(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load universities. Is the backend server running?");
        setLoading(false);
      });
  }, []);

  // Filter the universities list based on what's typed in the search box.
  // This runs on every render, but since it's just filtering an array already in memory,
  // it's cheap - no new network request needed as the user types.
  const filteredUniversities = universities.filter((university) =>
    university.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-gray-500">Loading universities...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left filter panel */}
      <aside className="w-64 border-r border-gray-200 p-4">
        <h2 className="font-semibold mb-2">Search</h2>
        <input
          type="text"
          placeholder="Search universities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </aside>

      {/* Main area - university grid */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Find Your University</h1>

        {filteredUniversities.length === 0 ? (
          <p className="text-gray-500">No universities match your search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {filteredUniversities.map((university) => (
              <button
                key={university.id}
                onClick={() => navigate(`/university/${university.id}`)}
                className="flex flex-col items-center justify-center border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-blue-400 transition"
              >
                {/* Placeholder logo circle until real logos are added */}
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mb-3">
                  {university.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-center">{university.name}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
