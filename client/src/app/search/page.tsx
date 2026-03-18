"use client";

import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import TaskCard from "@/components/TaskCard";
import UserCard from "@/components/UserCard";
import { useSearchQuery } from "@/state/api";
import { debounce } from "lodash";
import React, { useEffect, useMemo, useState } from "react";

const Search = () => {
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
      }, 400),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  const {
    data: searchResults,
    isLoading,
    isError,
  } = useSearchQuery(searchTerm, {
    skip: searchTerm.trim().length < 3,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    debouncedSetSearch(value);
  };

  const hasResults =
    !!searchResults &&
    ((searchResults.tasks?.length ?? 0) > 0 ||
      (searchResults.projects?.length ?? 0) > 0 ||
      (searchResults.users?.length ?? 0) > 0);

  return (
    <div className="p-8">
      <Header name="Search" />

      <div className="mt-4">
        <input
          type="text"
          placeholder="Search tasks, projects, users..."
          className="w-full rounded border p-3 shadow md:w-1/2"
          value={inputValue}
          onChange={handleChange}
        />
      </div>

      <div className="p-5">
        {inputValue.trim().length > 0 && inputValue.trim().length < 3 && (
          <p className="text-sm text-gray-500">
            Enter at least 3 characters to search.
          </p>
        )}

        {isLoading && <p>Loading...</p>}
        {isError && <p>Error occurred while fetching search results.</p>}

        {!isLoading && !isError && searchTerm.trim().length >= 3 && !hasResults && (
          <p className="text-gray-500">No results found.</p>
        )}

        {!isLoading && !isError && searchResults && hasResults && (
          <div className="space-y-8">
            {searchResults.tasks && searchResults.tasks.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">Tasks</h2>
                <div className="space-y-3">
                  {searchResults.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {searchResults.projects && searchResults.projects.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">Projects</h2>
                <div className="space-y-3">
                  {searchResults.projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}

            {searchResults.users && searchResults.users.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">Users</h2>
                <div className="space-y-3">
                  {searchResults.users.map((user) => (
                    <UserCard key={user.userId} user={user} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;