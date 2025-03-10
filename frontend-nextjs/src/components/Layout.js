import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  // This should only run for authenticated non-dashboard pages, handled by _app.js
  if (!user) return null; // Rely on _app.js to redirect

  const links = {
    implementor: [{ href: "/dashboard/implementor", label: "Manage Documents" }],
    hod: [{ href: "/dashboard/hod", label: "Review Requests" }],
    staff: [{ href: "/dashboard/staff", label: "View Documents" }],
    student: [{ href: "/dashboard/student", label: "View Policies" }],
  };

  const role = user.role.toLowerCase(); // Normalize to lowercase
  const roleLinks = links[role] || []; // Default to empty array if role not found

  return (
    <div>
      <nav className="bg-gray-800 text-white p-4">
        {roleLinks.map((link) => (
          <Link key={link.href} href={link.href} className="mr-4">
            {link.label}
          </Link>
        ))}
        <button onClick={logout} className="ml-4 hover:underline">
          Logout
        </button>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}