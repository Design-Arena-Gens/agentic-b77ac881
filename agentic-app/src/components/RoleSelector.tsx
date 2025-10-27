"use client";

import { useState } from "react";
import { useDataContext } from "@/context/DataContext";
import { UserProfile } from "@/lib/types";

const roles = ["Admin", "Staff", "Accountant"] as const;

export const RoleSelector = () => {
  const { userProfile, setUserProfile } = useDataContext();
  const profileKey = userProfile ? `${userProfile.id}-${userProfile.role}` : "no-profile";
  return (
    <RoleSelectorForm
      key={profileKey}
      initialName={userProfile?.name}
      initialRole={userProfile?.role ?? "Admin"}
      onSwitch={setUserProfile}
    />
  );
};

interface RoleSelectorFormProps {
  initialName?: string;
  initialRole: (typeof roles)[number];
  onSwitch: (profile: UserProfile) => void;
}

const RoleSelectorForm = ({ initialName, initialRole, onSwitch }: RoleSelectorFormProps) => {
  const [name, setName] = useState(initialName ?? "");
  const [role, setRole] = useState<(typeof roles)[number]>(initialRole);

  const handleSave = () => {
    const computedName = name.trim()
      ? name
      : role === "Admin"
        ? "Business Owner"
        : role === "Staff"
          ? "Packing Team"
          : "Accountant";
    onSwitch({
      id: `user-${role.toLowerCase()}`,
      name: computedName,
      role,
    });
  };

  return (
    <div className="flex items-center gap-3">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as (typeof roles)[number])}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
      >
        {roles.map((roleOption) => (
          <option key={roleOption}>{roleOption}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleSave}
        className="rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
      >
        Switch Role
      </button>
    </div>
  );
};
