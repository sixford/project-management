"use client";

import Modal from "@/components/Modal";
import { useCreateTeamMutation, useGetUsersQuery } from "@/state/api";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ModalNewTeam = ({ isOpen, onClose }: Props) => {
  const [createTeam, { isLoading, error }] = useCreateTeamMutation();
  const { data: users } = useGetUsersQuery();

  const [teamName, setTeamName] = useState("");
  const [productOwnerUserId, setProductOwnerUserId] = useState("");
  const [projectManagerUserId, setProjectManagerUserId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTeamName("");
    setProductOwnerUserId("");
    setProjectManagerUserId("");
    setLocalError(null);
  }, [isOpen]);

  const isFormValid = useMemo(() => {
    return teamName.trim().length > 0;
  }, [teamName]);

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const selectStyles =
    "block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const getErrorMessage = () => {
    if (localError) return localError;
    if (!error) return null;

    if ("data" in error) {
      const data = error.data as { message?: string } | string;
      if (typeof data === "string") return data;
      if (data?.message) return data.message;
    }

    return "Failed to create team";
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setLocalError(null);

    try {
      await createTeam({
        teamName: teamName.trim(),
        productOwnerUserId: productOwnerUserId
          ? Number(productOwnerUserId)
          : undefined,
        projectManagerUserId: projectManagerUserId
          ? Number(projectManagerUserId)
          : undefined,
      }).unwrap();

      onClose();
    } catch {
      // handled by RTK Query error state
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Team">
      <form
        className="mt-4 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <input
          type="text"
          className={inputStyles}
          placeholder="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium dark:text-white">
            Product Owner (optional)
          </label>
          <select
            className={selectStyles}
            value={productOwnerUserId}
            onChange={(e) => setProductOwnerUserId(e.target.value)}
          >
            <option value="">None</option>
            {(users ?? []).map((user) => (
              <option key={user.userId} value={String(user.userId ?? "")}>
                {user.username}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium dark:text-white">
            Project Manager (optional)
          </label>
          <select
            className={selectStyles}
            value={projectManagerUserId}
            onChange={(e) => setProjectManagerUserId(e.target.value)}
          >
            <option value="">None</option>
            {(users ?? []).map((user) => (
              <option key={user.userId} value={String(user.userId ?? "")}>
                {user.username}
              </option>
            ))}
          </select>
        </div>

        {getErrorMessage() ? (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {getErrorMessage()}
          </p>
        ) : null}

        <button
          type="submit"
          className={`focus-offset-2 mt-4 flex w-full justify-center rounded-md border border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            !isFormValid || isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? "Creating..." : "Create Team"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTeam;