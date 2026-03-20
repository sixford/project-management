"use client";

import { useGetTasksQuery, useUpdateTaskStatusMutation } from "@/state/api";
import React, { useMemo, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Task as TaskType } from "@/state/api";
import { EllipsisVertical, MessageSquareMore, Plus, User } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { getS3ImageUrl } from "@/lib/utils";

type BoardProps = {
  id: string;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

type DragItem = {
  id: number;
  status?: string;
};

const taskStatus = ["To Do", "Work In Progress", "Under Review", "Completed"];

const BoardView = ({ id, setIsModalNewTaskOpen }: BoardProps) => {
  const projectId = Number(id);

  const {
    data: tasks,
    isLoading,
    error,
  } = useGetTasksQuery({ projectId });

  const [updateTaskStatus, { isLoading: isUpdatingStatus }] =
    useUpdateTaskStatusMutation();

  const moveTask = async (
    taskId: number,
    fromStatus: string | undefined,
    toStatus: string
  ) => {
    if (!taskId || !toStatus || fromStatus === toStatus) return;

    try {
      await updateTaskStatus({ taskId, status: toStatus }).unwrap();
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  };

  const safeTasks = useMemo(() => tasks ?? [], [tasks]);

  if (isLoading) return <div className="p-4">Loading board...</div>;
  if (error) {
    return <div className="p-4">An error occurred while fetching tasks.</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={safeTasks}
            moveTask={moveTask}
            setIsModalNewTaskOpen={setIsModalNewTaskOpen}
            isUpdatingStatus={isUpdatingStatus}
          />
        ))}
      </div>
    </DndProvider>
  );
};

type TaskColumnProps = {
  status: string;
  tasks: TaskType[];
  moveTask: (taskId: number, fromStatus: string | undefined, toStatus: string) => void;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
  isUpdatingStatus: boolean;
};

const TaskColumn = ({
  status,
  tasks,
  moveTask,
  setIsModalNewTaskOpen,
  isUpdatingStatus,
}: TaskColumnProps) => {
  const [{ isOver, canDrop }, drop] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: "task",
      canDrop: (item) => item.status !== status,
      drop: (item) => moveTask(item.id, item.status, status),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [status, moveTask]
  );

  const columnTasks = tasks.filter((task) => task.status === status);
  const tasksCount = columnTasks.length;

  const statusColor: Record<string, string> = {
    "To Do": "#2563EB",
    "Work In Progress": "#059669",
    "Under Review": "#D97706",
    Completed: "#000000",
  };

  const highlightClass =
    isOver && canDrop ? "bg-blue-100 dark:bg-neutral-950" : "";

  return (
    <div
      ref={(node) => {
        if (node) drop(node);
      }}
      className={`rounded-lg py-2 xl:px-2 ${highlightClass}`}
    >
      <div className="mb-3 flex w-full">
        <div
          className="w-2 rounded-s-lg"
          style={{ backgroundColor: statusColor[status] }}
        />
        <div className="flex w-full items-center justify-between rounded-e-lg bg-white px-5 py-4 dark:bg-dark-secondary">
          <h3 className="flex items-center text-lg font-semibold dark:text-white">
            {status}
            <span
              className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
              style={{ width: "1.5rem", height: "1.5rem" }}
            >
              {tasksCount}
            </span>
          </h3>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-5 items-center justify-center dark:text-neutral-500"
              disabled={isUpdatingStatus}
            >
              <EllipsisVertical size={20} />
            </button>

            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 dark:bg-dark-tertiary dark:text-white"
              onClick={() => setIsModalNewTaskOpen(true)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {columnTasks.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-white/60 p-4 text-sm text-gray-500 dark:border-dark-tertiary dark:bg-dark-secondary dark:text-neutral-400">
          No tasks yet
        </div>
      ) : (
        columnTasks.map((task) => <Task key={task.id} task={task} />)
      )}
    </div>
  );
};

type TaskProps = {
  task: TaskType;
};

const Task = ({ task }: TaskProps) => {
  const [coverError, setCoverError] = useState(false);
  const [assigneeError, setAssigneeError] = useState(false);
  const [authorError, setAuthorError] = useState(false);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "task",
      item: { id: task.id, status: task.status },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [task.id, task.status]
  );

  const taskTagsSplit = task.tags
    ? task.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  const formattedStartDate = task.startDate
    ? format(new Date(task.startDate), "P")
    : "";
  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "P")
    : "";

  const numberOfComments = task.comments?.length || 0;
  const firstAttachment = task.attachments?.[0];

  const coverImageUrl = getS3ImageUrl(firstAttachment?.fileURL);
  const assigneeAvatarUrl = getS3ImageUrl(task.assignee?.profilePictureUrl);
  const authorAvatarUrl = getS3ImageUrl(task.author?.profilePictureUrl);

  const PriorityTag = ({ priority }: { priority: TaskType["priority"] }) => (
    <div
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        priority === "Urgent"
          ? "bg-red-200 text-red-700"
          : priority === "High"
          ? "bg-yellow-200 text-yellow-700"
          : priority === "Medium"
          ? "bg-green-200 text-green-700"
          : priority === "Low"
          ? "bg-blue-200 text-blue-700"
          : "bg-gray-200 text-gray-700"
      }`}
    >
      {priority}
    </div>
  );

  const avatarBase =
    "h-8 w-8 rounded-full border-2 border-white object-cover dark:border-dark-secondary";

  return (
    <div
      ref={(node) => {
        if (node) drag(node);
      }}
      className={`mb-4 rounded-md bg-white shadow dark:bg-dark-secondary ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      {coverImageUrl && !coverError && (
        <Image
          src={coverImageUrl}
          alt={firstAttachment?.fileName || "Task attachment"}
          width={400}
          height={200}
          className="h-auto w-full rounded-t-md"
          onError={() => setCoverError(true)}
        />
      )}

      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {task.priority && <PriorityTag priority={task.priority} />}

            <div className="flex flex-wrap gap-2">
              {taskTagsSplit.map((tag) => (
                <div
                  key={tag}
                  className="rounded-full bg-blue-100 px-2 py-1 text-xs"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="flex h-6 w-4 flex-shrink-0 items-center justify-center dark:text-neutral-500"
          >
            <EllipsisVertical size={20} />
          </button>
        </div>

        <div className="my-3 flex justify-between gap-3">
          <h4 className="text-md font-bold dark:text-white">{task.title}</h4>
          {typeof task.points === "number" && (
            <div className="text-xs font-semibold dark:text-white">
              {task.points} pts
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-neutral-500">
          {formattedStartDate && <span>{formattedStartDate}</span>}
          {formattedStartDate && formattedDueDate && <span> - </span>}
          {formattedDueDate && <span>{formattedDueDate}</span>}
        </div>

        <p className="mt-2 text-sm text-gray-600 dark:text-neutral-500">
          {task.description}
        </p>

        <div className="mt-4 border-t border-gray-200 dark:border-stroke-dark" />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-[6px] overflow-hidden">
            {task.assignee ? (
              assigneeAvatarUrl && !assigneeError ? (
                <Image
                  key={`assignee-${task.assignee.userId}`}
                  src={assigneeAvatarUrl}
                  alt={task.assignee.username}
                  width={30}
                  height={30}
                  className={avatarBase}
                  onError={() => setAssigneeError(true)}
                />
              ) : (
                <div
                  className={`${avatarBase} flex items-center justify-center bg-gray-200 text-gray-600`}
                  title={task.assignee.username}
                >
                  <User size={14} />
                </div>
              )
            ) : null}

            {task.author ? (
              authorAvatarUrl && !authorError ? (
                <Image
                  key={`author-${task.author.userId}`}
                  src={authorAvatarUrl}
                  alt={task.author.username}
                  width={30}
                  height={30}
                  className={avatarBase}
                  onError={() => setAuthorError(true)}
                />
              ) : (
                <div
                  className={`${avatarBase} flex items-center justify-center bg-gray-200 text-gray-600`}
                  title={task.author.username}
                >
                  <User size={14} />
                </div>
              )
            ) : null}
          </div>

          <div className="flex items-center text-gray-500 dark:text-neutral-500">
            <MessageSquareMore size={20} />
            <span className="ml-1 text-sm dark:text-neutral-400">
              {numberOfComments}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardView;