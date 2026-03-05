"use client";

import React, { useMemo, useState } from "react";
import {
  Priority,
  Project,
  Task,
  useGetProjectsQuery,
  useGetTasksQuery,
} from "@/state/api";
import { useAppSelector } from "../redux";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Header from "@/components/Header";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dataGridClassNames, dataGridSxStyles } from "@/lib/utils";
import { PlusSquare } from "lucide-react";

// ✅ import your existing modal
import ModalNewProject from "@/app/projects/ModalNewProject";

const taskColumns: GridColDef[] = [
  { field: "title", headerName: "Title", width: 200 },
  { field: "status", headerName: "Status", width: 150 },
  { field: "priority", headerName: "Priority", width: 150 },
  { field: "dueDate", headerName: "Due Date", width: 150 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const HomePage = () => {
  const [isModalNewProjectOpen, setIsModalNewProjectOpen] = useState(false);

  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  // ✅ Fetch projects first
  const {
    data: projects,
    isLoading: projectsLoading,
    isError: projectsError,
  } = useGetProjectsQuery();

  // ✅ Pick a “default” project to show tasks for (first one)
  const defaultProjectId = useMemo(() => {
    return projects?.[0]?.id;
  }, [projects]);

  // ✅ Fetch tasks only if we have a project id
  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useGetTasksQuery(
    { projectId: defaultProjectId ?? 0 },
    { skip: !defaultProjectId }
  );

  const chartColors = isDarkMode
    ? {
        bar: "#8884d8",
        barGrid: "#303030",
        text: "#FFFFFF",
      }
    : {
        bar: "#8884d8",
        barGrid: "#E0E0E0",
        text: "#000000",
      };

  // Loading / error states
  if (projectsLoading) return <div>Loading..</div>;
  if (projectsError || !projects) return <div>Error fetching projects</div>;

  // Build charts safely even if there are no tasks yet
  const safeTasks: Task[] = tasks ?? [];

  const priorityCount = safeTasks.reduce(
    (acc: Record<string, number>, task: Task) => {
      const { priority } = task;
      const key = (priority as Priority) || "Backlog";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );

  const taskDistribution = Object.keys(priorityCount).map((key) => ({
    name: key,
    count: priorityCount[key],
  }));

  const statusCount = projects.reduce(
    (acc: Record<string, number>, project: Project) => {
      const status = project.endDate ? "Completed" : "Active";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {}
  );

  const projectStatus = Object.keys(statusCount).map((key) => ({
    name: key,
    count: statusCount[key],
  }));

  return (
    <div className="container h-full w-[100%] bg-gray-100 bg-transparent p-8">
      <ModalNewProject
        isOpen={isModalNewProjectOpen}
        onClose={() => setIsModalNewProjectOpen(false)}
      />

      <Header
        name="Project Management Dashboard"
        buttonComponent={
          <button
            className="flex items-center rounded-md bg-blue-primary px-3 py-2 text-white hover:bg-blue-600"
            onClick={() => setIsModalNewProjectOpen(true)}
            type="button"
          >
            <PlusSquare className="mr-2 h-5 w-5" /> New Project
          </button>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow dark:bg-dark-secondary">
          <h3 className="mb-4 text-lg font-semibold dark:text-white">
            Task Priority Distribution
          </h3>

          {!defaultProjectId ? (
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Create a project to see task analytics.
            </p>
          ) : tasksLoading ? (
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Loading tasks…
            </p>
          ) : tasksError ? (
            <p className="text-sm text-red-600">Error fetching tasks</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.barGrid} />
                <XAxis dataKey="name" stroke={chartColors.text} />
                <YAxis stroke={chartColors.text} />
                <Tooltip
                  contentStyle={{
                    width: "min-content",
                    height: "min-content",
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill={chartColors.bar} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg bg-white p-4 shadow dark:bg-dark-secondary">
          <h3 className="mb-4 text-lg font-semibold dark:text-white">
            Project Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie dataKey="count" data={projectStatus} fill="#82ca9d" label>
                {projectStatus.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg bg-white p-4 shadow dark:bg-dark-secondary md:col-span-2">
          <h3 className="mb-4 text-lg font-semibold dark:text-white">
            Your Tasks
          </h3>

          {!defaultProjectId ? (
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              No projects yet — create one to start adding tasks.
            </p>
          ) : (
            <div style={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={safeTasks}
                columns={taskColumns}
                checkboxSelection
                loading={tasksLoading}
                getRowClassName={() => "data-grid-row"}
                getCellClassName={() => "data-grid-cell"}
                className={dataGridClassNames}
                sx={dataGridSxStyles(isDarkMode)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;