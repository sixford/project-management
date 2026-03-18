"use client";

import Modal from "@/components/Modal";
import {
  Priority,
  Status,
  useCreateTaskMutation,
  useGetUsersQuery,
} from "@/state/api";
import React, { useEffect, useMemo, useState } from "react";
import { formatISO, isAfter } from "date-fns";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
};

const ModalNewTask = ({ isOpen, onClose, id = null }: Props) => {
  const [createTask, { isLoading, error }] = useCreateTaskMutation();
  const { data: users } = useGetUsersQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState<Priority>(Priority.Backlog);
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setDescription("");
    setStatus(Status.ToDo);
    setPriority(Priority.Backlog);
    setTags("");
    setStartDate("");
    setDueDate("");
    setProjectId("");
    setAssignedUserId("");
    setLocalError(null);
  }, [isOpen]);

  const effectiveProjectId = useMemo(() => {
    const value = id !== null ? Number(id) : projectId ? Number(projectId) : null;
    return value && Number.isFinite(value) && value > 0 ? value : null;
  }, [id, projectId]);

  const isFormValid = useMemo(() => {
    return title.trim().length > 0 && effectiveProjectId !== null;
  }, [title, effectiveProjectId]);

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const selectStyles =
    "mb-4 block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const getErrorMessage = () => {
    if (localError) return localError;
    if (!error) return null;
    if ("data" in error) {
      const data = error.data as { message?: string } | string;
      if (typeof data === "string") return data;
      if (data?.message) return data.message;
    }
    return "Failed to create task";
  };

  const handleSubmit = async () => {
    if (!isFormValid || effectiveProjectId === null) return;

    setLocalError(null);

    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (isAfter(start, due)) {
        setLocalError("Due date cannot be earlier than start date.");
        return;
      }
    }

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .join(",") || undefined,
        projectId: effectiveProjectId,
        assignedUserId: assignedUserId ? Number(assignedUserId) : undefined,
        startDate: startDate
          ? formatISO(new Date(startDate), { representation: "complete" })
          : undefined,
        dueDate: dueDate
          ? formatISO(new Date(dueDate), { representation: "complete" })
          : undefined,
      }).unwrap();

      onClose();
    } catch {
      // handled by RTK error state
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Task">
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
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className={inputStyles}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <select
            className={selectStyles}
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            <option value={Status.ToDo}>To Do</option>
            <option value={Status.WorkInProgress}>Work In Progress</option>
            <option value={Status.UnderReview}>Under Review</option>
            <option value={Status.Completed}>Completed</option>
          </select>

          <select
            className={selectStyles}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value={Priority.Urgent}>Urgent</option>
            <option value={Priority.High}>High</option>
            <option value={Priority.Medium}>Medium</option>
            <option value={Priority.Low}>Low</option>
            <option value={Priority.Backlog}>Backlog</option>
          </select>
        </div>

        <input
          type="text"
          className={inputStyles}
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
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
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <select
          className={selectStyles}
          value={assignedUserId}
          onChange={(e) => setAssignedUserId(e.target.value)}
        >
          <option value="">Assign to… (optional)</option>
          {(users ?? []).map((u) => (
            <option key={u.userId} value={String(u.userId ?? "")}>
              {u.username}
            </option>
          ))}
        </select>

        {id === null && (
          <input
            type="number"
            className={inputStyles}
            placeholder="Project ID"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        )}

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
          {isLoading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;