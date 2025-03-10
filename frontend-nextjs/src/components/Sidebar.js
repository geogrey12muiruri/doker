import { useState, useEffect } from 'react';
import {
  Bell,
  BookOpen,
  FileText,
  LayoutDashboard,
  Users,
  CheckSquare,
  Clock,
  Settings,
  User,
  ClipboardList,
  GraduationCap,
  File,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';

const ACCESS_LEVELS_ALL = ['implementor', 'hod', 'staff', 'student'];

const SidebarIcon = ({ icon: Icon }) => {
  return <Icon className="size-6 lg:size-5 transition-all duration-200" />;
};

export default function Sidebar() {
  const { getRole } = useAuth();
  const [role, setRole] = useState(null);

  useEffect(() => {
    async function fetchRole() {
      const userRole = await getRole();
      setRole(userRole?.toLowerCase() || 'staff');
    }
    fetchRole();
  }, [getRole]);

  const SIDEBAR_LINKS = [
    {
      label: 'MENU',
      links: [
        {
          name: 'Dashboard',
          href: `/dashboard/${role || 'staff'}`,
          access: ACCESS_LEVELS_ALL,
          icon: LayoutDashboard,
        },
        {
          name: 'Profile',
          href: '/profile',
          access: ACCESS_LEVELS_ALL,
          icon: User,
        },
        {
          name: 'Documents',
          href: '/documents',
          access: ACCESS_LEVELS_ALL,
          icon: File,
        },
      ],
    },
    {
      label: 'Manage',
      links: [
        {
          name: 'User Management',
          href: '/manage/users',
          access: ['implementor'],
          icon: Users,
        },
        {
          name: 'Course Management',
          href: '/manage/courses',
          access: ['implementor', 'hod', 'staff'],
          icon: BookOpen,
        },
        {
          name: 'Student Requests',
          href: '/manage/requests',
          access: ['hod', 'staff'],
          icon: ClipboardList,
        },
        {
          name: 'Exam & Grades',
          href: '/manage/exams',
          access: ['staff'],
          icon: CheckSquare,
        },
        {
          name: 'Class Schedules',
          href: '/schedule',
          access: ['hod', 'staff', 'student'],
          icon: Clock,
        },
        {
          name: 'Enrollment Requests',
          href: '/enrollment/requests',
          access: ['hod'],
          icon: FileText,
        },
      ],
    },
    {
      label: 'System',
      links: [
        {
          name: 'Notifications',
          href: '/notifications',
          access: ACCESS_LEVELS_ALL,
          icon: Bell,
        },
        {
          name: 'Settings',
          href: '/settings',
          access: ['implementor'],
          icon: Settings,
        },
      ],
    },
  ];

  if (!role) {
    return <div className="w-16 lg:w-64 h-screen bg-zinc-200 p-4">Loading...</div>;
  }

  return (
    <div className="w-16 lg:w-64 h-screen p-4 flex flex-col justify-between gap-6 bg-zinc-200 shadow-lg transition-all duration-300">
      <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-1 rounded-lg bg-white shadow-md transition-transform hover:scale-105">
            <Image
              src="https://res.cloudinary.com/dws2bgxg4/image/upload/v1739707358/logoooo_vvxiak.jpg"
              alt="UniERP"
              width={40}
              height={40}
              className="rounded-md"
            />
          </div>
          <span className="hidden lg:block text-xl font-semibold text-gray-800 tracking-tight">
            UniERP
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {SIDEBAR_LINKS.map((section) => (
          <div key={section.label} className="mb-6">
            <span className="hidden lg:block px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {section.label}
            </span>
            <div className="mt-2 space-y-1">
              {section.links.map((link) => {
                if (link.access.includes(role)) {
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 text-gray-600 rounded-lg transition-all duration-200 hover:bg-blue-100 hover:text-blue-700 group"
                    >
                      <SidebarIcon icon={link.icon} />
                      <span className="hidden lg:block text-sm font-medium group-hover:font-semibold">
                        {link.name}
                      </span>
                    </Link>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
