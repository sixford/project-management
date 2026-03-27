"use client";

import React, { useMemo, useState } from "react";
import ProjectHeader from "@/app/projects/ProjectHeader";
import Board from "../BoardView";
import List from "../ListView";
import Timeline from "../TimelineView";
import Table from "../TableView";
import ModalNewTask from "@/components/ModalNewTask";
import { useGetProjectsQuery } from "@/state/api";

type Props = {
  params: { id: string };
};

const Project = ({ params }: Props) => {
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

  const projectId = useMemo(() => Number(params.id), [params.id]);
  const isValidId = Number.isFinite(projectId) && projectId > 0;

  const {
    data: projects,
    isLoading: projectsLoading,
    isError: projectsError,
  } = useGetProjectsQuery(undefined, { skip: !isValidId });

  const project = useMemo(() => {
    if (!projects) return undefined;
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  if (!isValidId) {
    return (
      <main className="p-6">
        <h1 className="text-lg font-semibold">Invalid project id</h1>
        <p className="mt-2 text-sm text-gray-600">
          The URL param must be a number. Got: <code>{params.id}</code>
        </p>
      </main>
    );
  }

  if (projectsLoading) {
    return (
      <main className="p-6">
        <h1 className="text-lg font-semibold">Loading project…</h1>
      </main>
    );
  }

  if (projectsError || !project) {
    return (
      <main className="p-6">
        <h1 className="text-lg font-semibold">Project not found</h1>
        <p className="mt-2 text-sm text-gray-600">
          You do not have access to this project, or it does not exist.
        </p>
      </main>
    );
  }

  return (
    <div>
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        id={String(projectId)}
      />

      <ProjectHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        title={project.name}
        onNewTask={() => setIsModalNewTaskOpen(true)}
      />

      {activeTab === "Board" && (
        <Board id={String(projectId)} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
      {activeTab === "List" && (
        <List id={String(projectId)} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
      {activeTab === "Timeline" && (
        <Timeline id={String(projectId)} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
      {activeTab === "Table" && (
        <Table id={String(projectId)} setIsModalNewTaskOpen={setIsModalNewTaskOpen} />
      )}
    </div>
  );
};

export default Project;