"use client";

import Modal from "@/components/Modal";
import { Priority, Status, useCreateTaskMutation, useGetUsersQuery } from "@/state/api";
import React, { useEffect, useMemo, useState } from "react";
import { formatISO } from "date-fns";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null; // project id from route if provided
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

  // optional if you ever open modal without a project page
  const [projectId, setProjectId] = useState("");

  // assignee dropdown
  const [assignedUserId, setAssignedUserId] = useState<string>("");

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
  }, [isOpen]);

  const effectiveProjectId = useMemo(() => {
    return id !== null ? Number(id) : projectId ? Number(projectId) : null;
  }, [id, projectId]);

  const isFormValid = () => {
    return Boolean(title) && Boolean(effectiveProjectId);
  };

  const inputStyles =
    "w-full rounded border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const selectStyles =
    "mb-4 block w-full rounded border border-gray-300 px-3 py-2 dark:border-dark-tertiary dark:bg-dark-tertiary dark:text-white dark:focus:outline-none";

  const handleSubmit = async () => {
    if (!isFormValid() || !effectiveProjectId) return;

    const payload: any = {
      title,
      description,
      status,
      priority,
      tags,
      projectId: effectiveProjectId,
      // ✅ authorUserId no longer sent (server sets it)
      assignedUserId: assignedUserId ? Number(assignedUserId) : undefined,
      startDate: startDate
        ? formatISO(new Date(startDate), { representation: "complete" })
        : undefined,
      dueDate: dueDate
        ? formatISO(new Date(dueDate), { representation: "complete" })
        : undefined,
    };

    const res = await createTask(payload);

    if ("data" in res) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Task">
      <form
        className="mt-4 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
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

        {/* ✅ Assignee dropdown */}
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

        {/* Only show projectId field if not on /projects/[id] */}
        {id === null && (
          <input
            type="number"
            className={inputStyles}
            placeholder="Project ID"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        )}

        {error ? (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {"data" in (error as any) ? JSON.stringify((error as any).data) : "Failed to create task"}
          </p>
        ) : null}

        <button
          type="submit"
          className={`focus-offset-2 mt-4 flex w-full justify-center rounded-md border border-transparent bg-blue-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            !isFormValid() || isLoading ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;