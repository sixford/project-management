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

  // ✅ Parse route param once
  const projectId = useMemo(() => Number(params.id), [params.id]);

  // ✅ Guard invalid ids early
  const isValidId = Number.isFinite(projectId) && projectId > 0;

  // ✅ Fetch project list and derive name (no extra endpoint needed)
  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery(
    undefined,
    { skip: !isValidId }
  );

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

  return (
    <div>
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
        // ⬇️ keep passing string if your ModalNewTask expects string
        // but it’s better long-term to change ModalNewTask to accept number
        id={String(projectId)}
      />

      <ProjectHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        // ✅ new prop so header can show real name
        title={
          projectsLoading
            ? "Loading…"
            : project?.name ?? `Project #${projectId}`
        }
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