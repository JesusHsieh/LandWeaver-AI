import React from 'react';
import LandWeaverHeader from '../navbar/LandWeaverHeader';

interface AppLayoutProps {
  /** Project display name shown in the header */
  projectName: string;
  /** Emoji icon for the project */
  projectEmoji?: string;
  /** Optional subtitle below the project name */
  subtitle?: string;
  /** Use dark theme (for modules 03, 04) */
  dark?: boolean;
  /** Page content */
  children: React.ReactNode;
}

/**
 * AppLayout — shared full-page wrapper
 *
 * Provides:
 *  - Sticky LandWeaverHeader at the top
 *  - Full-height flex column container
 *
 * Usage:
 *   <AppLayout projectName="My Tool" projectEmoji="🔧" dark={false}>
 *     <YourContent />
 *   </AppLayout>
 */
const AppLayout: React.FC<AppLayoutProps> = ({
  projectName,
  projectEmoji,
  subtitle,
  dark = false,
  children,
}) => {
  return (
    <div
      className={`min-h-screen flex flex-col ${
        dark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-slate-800'
      }`}
    >
      <LandWeaverHeader
        projectName={projectName}
        projectEmoji={projectEmoji}
        subtitle={subtitle}
        dark={dark}
      />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
