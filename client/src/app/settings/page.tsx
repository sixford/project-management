"use client";

import Header from "@/components/Header";
import { useGetAuthUserQuery, useGetTeamsQuery } from "@/state/api";
import React, { useMemo } from "react";

const Settings = () => {
  const {
    data: currentUser,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useGetAuthUserQuery();

  const {
    data: teams,
    isLoading: isTeamsLoading,
  } = useGetTeamsQuery();

  const userDetails = currentUser?.userDetails;
  const basicUser = currentUser?.user;

  const teamName = useMemo(() => {
    if (!userDetails?.teamId || !teams) return "Not set";

    const team = teams.find((t) => {
      // your Team type currently uses teamId
      return t.teamId === userDetails.teamId;
    });

    return team?.teamName || "Not set";
  }, [teams, userDetails?.teamId]);

  if (isUserLoading || isTeamsLoading) {
    return <div className="p-8">Loading settings...</div>;
  }

  if (isUserError || !currentUser) {
    return <div className="p-8">Could not load settings.</div>;
  }

  const labelStyles = "block text-sm font-medium text-gray-700 dark:text-white";
  const textStyles =
    "mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary dark:text-white";

  return (
    <div className="p-8">
      <Header name="Settings" />

      <div className="mt-6 space-y-4 max-w-2xl">
        <div>
          <label className={labelStyles}>Username</label>
          <div className={textStyles}>{userDetails?.username || "Not set"}</div>
        </div>

        <div>
          <label className={labelStyles}>Email</label>
          <div className={textStyles}>{basicUser?.email || "Not set"}</div>
        </div>

        <div>
          <label className={labelStyles}>Team</label>
          <div className={textStyles}>{teamName}</div>
        </div>

        <div>
          <label className={labelStyles}>Cognito ID</label>
          <div className={textStyles}>{userDetails?.cognitoId || "Not set"}</div>
        </div>

        <div>
          <label className={labelStyles}>Role</label>
          <div className={textStyles}>Not set</div>
        </div>
      </div>
    </div>
  );
};

export default Settings;