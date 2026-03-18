"use client";

import { Project } from "@/state/api";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import React from "react";

type Props = {
  project: Project;
};

const ProjectCard = ({ project }: Props) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/projects/${project.id}`)}
      className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-dark-tertiary dark:bg-dark-secondary"
    >
      {/* Title */}
      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
        {project.name}
      </h3>

      {/* Description */}
      <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
        {project.description || "No description provided"}
      </p>

      {/* Dates */}
      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
        <span>
          <strong>Start:</strong>{" "}
          {project.startDate
            ? format(new Date(project.startDate), "PPP")
            : "Not set"}
        </span>
        <span>
          <strong>End:</strong>{" "}
          {project.endDate
            ? format(new Date(project.endDate), "PPP")
            : "Not set"}
        </span>
      </div>
    </div>
  );
};

export default ProjectCard;