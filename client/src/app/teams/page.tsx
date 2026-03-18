"use client";

import React, { useState } from "react";
import { useGetTeamsQuery } from "@/state/api";
import { useAppSelector } from "../redux";
import Header from "@/components/Header";
import ModalNewTeam from "@/components/ModalNewTeam";
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { dataGridClassNames, dataGridSxStyles } from "@/lib/utils";

const CustomToolbar = () => (
  <GridToolbarContainer className="toolbar flex gap-2">
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const columns: GridColDef[] = [
  { field: "id", headerName: "Team ID", width: 100 },
  { field: "teamName", headerName: "Team Name", width: 220 },
  {
    field: "productOwnerUsername",
    headerName: "Product Owner",
    width: 200,
    renderCell: (params) => params.value || "Not set",
  },
  {
    field: "projectManagerUsername",
    headerName: "Project Manager",
    width: 200,
    renderCell: (params) => params.value || "Not set",
  },
];

const Teams = () => {
  const [isModalNewTeamOpen, setIsModalNewTeamOpen] = useState(false);

  const { data: teams, isLoading, isError } = useGetTeamsQuery();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  if (isLoading) return <div>Loading...</div>;
  if (isError || !teams) return <div>Error fetching teams</div>;

  return (
    <div className="flex w-full flex-col p-8">
      {/* ✅ Modal */}
      <ModalNewTeam
        isOpen={isModalNewTeamOpen}
        onClose={() => setIsModalNewTeamOpen(false)}
      />

      {/* ✅ Header with button */}
      <Header
        name="Teams"
        buttonComponent={
          <button
            className="rounded bg-blue-primary px-4 py-2 font-medium text-white hover:bg-blue-600"
            onClick={() => setIsModalNewTeamOpen(true)}
            type="button"
          >
            New Team
          </button>
        }
      />

      <div style={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={teams}
          columns={columns}
          pagination
          slots={{
            toolbar: CustomToolbar,
          }}
          getRowId={(row) => row.id} // ✅ important safeguard
          className={dataGridClassNames}
          sx={dataGridSxStyles(isDarkMode)}
        />
      </div>
    </div>
  );
};

export default Teams;