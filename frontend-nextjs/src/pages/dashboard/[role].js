import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";

export default function Dashboard({ documents }) {
  const { user } = useAuth();
  const router = useRouter();

  // Check if user is authenticated and their role matches the role in the URL
  if (!user || user.role.toLowerCase() !== router.query.role.toLowerCase()) {
    router.push("/");
    return null;
  }

  return (
    <div>
      <h1>{user.role} Dashboard</h1>
      {/* Render based on role */}
      {documents.map((doc) => (
        <div key={doc.id}>{doc.title} - {doc.status}</div>
      ))}
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const token = req.cookies.token || ""; // Or localStorage on client
  try {
    const res = await fetch("http://localhost:8080/api/backend1/documents", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch documents: ${res.statusText}`);
    }
    const documents = await res.json();
    return { props: { documents } };
  } catch (error) {
    console.error('Error fetching documents:', error);
    return { props: { documents: [] } };
  }
}