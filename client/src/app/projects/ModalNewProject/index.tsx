"use client";

import Modal from "@/components/Modal";
import { useCreateProjectMutation } from "@/state/api";
import React, { useEffect, useState } from "react";
import { formatISO, isValid } from "date-fns";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ModalNewProject = ({ isOpen, onClose }: Props) => {
  const router = useRouter();

  const [createProject, { isLoading, error }] = useCreateProjectMutation();

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState(""); // yyyy-mm-dd
  const [localError, setLocalError] = useState<string | null>(null);

  const resetForm = () => {
    setProjectName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setLocalError(null);
  };

  // Reset form whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    resetForm();
  }, [isOpen]);

  const isFormValid =
    projectName.trim().length > 0 &&
    description.trim().length > 0 &&
    !!startDate &&
    !!endDate;

  const handleSubmit = async () => {
    setLocalError(null);
    if (!isFormValid) return;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isValid(start) || !isValid(end)) {
      setLocalError("Please enter valid start and end dates.");
      return;
    }

    try {
      const formattedStartDate = formatISO(start, { representation: "complete" });
      const formattedEndDate = formatISO(end, { representation: "complete" });

      const created = await createProject({
        name: projectName.trim(),
        description: description.trim(),
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      }).unwrap();

      // close + reset
      resetForm();
      onClose();

      // go to new project route
      if (created?.id) {
        router.push(`/projects/${created.id}`);
      }
    } catch (e: any) {
      // Prefer server message if present
      setLocalError(e?.data?.message || e?.message || "Failed to create project");
    }
  };

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const serverErrorText =
    (error as any)?.data?.message ||
    (error as any)?.error ||
    ((error as any)?.data ? JSON.stringify((error as any).data) : null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Project">
      <form
        className="mt-4 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {(localError || serverErrorText) && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {localError || serverErrorText || "Failed to create project"}
          </p>
        )}

        <input
          type="text"
          className={inputStyles}
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />

        <textarea
          className={inputStyles}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <input
            type="date"
            className={inputStyles}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className={inputStyles}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:hover:opacity-90"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className={`focus-offset-2 flex w-full justify-center rounded-md border border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              !isFormValid || isLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalNewProject;