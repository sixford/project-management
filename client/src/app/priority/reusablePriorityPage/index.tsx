"use client";

import { useAppSelector } from "@/app/redux";
import Header from "@/components/Header";
import ModalNewTask from "@/components/ModalNewTask";
import TaskCard from "@/components/TaskCard";
import { dataGridClassNames, dataGridSxStyles } from "@/lib/utils";
import {
  Task,
  useGetAuthUserQuery,
  useGetTasksByUserQuery,
} from "@/state/api";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { format } from "date-fns";
import React, { useMemo, useState } from "react";

type Props = {
  priority: string;
};

const columns: GridColDef[] = [
  {
    field: "title",
    headerName: "Title",
    width: 140,
  },
  {
    field: "description",
    headerName: "Description",
    width: 220,
  },
  {
    field: "status",
    headerName: "Status",
    width: 150,
    renderCell: (params) => (
      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
        {params.value}
      </span>
    ),
  },
  {
    field: "priority",
    headerName: "Priority",
    width: 100,
  },
  {
    field: "tags",
    headerName: "Tags",
    width: 140,
  },
  {
    field: "startDate",
    headerName: "Start Date",
    width: 130,
    renderCell: (params) =>
      params.value ? format(new Date(params.value), "P") : "Not set",
  },
  {
    field: "dueDate",
    headerName: "Due Date",
    width: 130,
    renderCell: (params) =>
      params.value ? format(new Date(params.value), "P") : "Not set",
  },
  {
    field: "author",
    headerName: "Author",
    width: 150,
    renderCell: (params) => params.value?.username || "Unknown",
  },
  {
    field: "assignee",
    headerName: "Assignee",
    width: 150,
    renderCell: (params) => params.value?.username || "Unassigned",
  },
];

const ReusablePriorityPage = ({ priority }: Props) => {
  const [view, setView] = useState("list");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

  const { data: currentUser } = useGetAuthUserQuery();
  const userId = currentUser?.userDetails?.userId ?? null;

  const {
    data: tasks,
    isLoading,
    isError: isTasksError,
  } = useGetTasksByUserQuery(userId || 0, {
    skip: userId === null,
  });

  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const filteredTasks = useMemo(() => {
    return tasks?.filter((task: Task) => task.priority === priority) ?? [];
  }, [tasks, priority]);

  if (isLoading) return <div>Loading tasks...</div>;
  if (isTasksError) return <div>Error fetching tasks</div>;

  return (
    <div className="m-5 p-4">
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
      />

      <Header
        name={`${priority} Priority`}
        buttonComponent={
          <button
            className="mr-3 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
            onClick={() => setIsModalNewTaskOpen(true)}
            type="button"
          >
            Add Task
          </button>
        }
      />

      <div className="mb-4 flex justify-start">
        <button
          className={`rounded-l px-4 py-2 ${
            view === "list" ? "bg-gray-300" : "bg-white"
          }`}
          onClick={() => setView("list")}
          type="button"
        >
          List
        </button>
        <button
          className={`rounded-r px-4 py-2 ${
            view === "table" ? "bg-gray-300" : "bg-white"
          }`}
          onClick={() => setView("table")}
          type="button"
        >
          Table
        </button>
      </div>

      {view === "list" ? (
        filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task: Task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div>No {priority.toLowerCase()} priority tasks found.</div>
        )
      ) : filteredTasks.length > 0 ? (
        <div className="z-0 w-full">
          <DataGrid
            rows={filteredTasks}
            columns={columns}
            checkboxSelection
            getRowId={(row) => row.id}
            className={dataGridClassNames}
            sx={dataGridSxStyles(isDarkMode)}
          />
        </div>
      ) : (
        <div>No {priority.toLowerCase()} priority tasks found.</div>
      )}
    </div>
  );
};

export default ReusablePriorityPage;