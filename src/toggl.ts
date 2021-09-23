import { Response, Project, TimeEntry, Workspace } from "toggl";

const TOGGL_API_URL = "https://api.track.toggl.com/api/v8";

export const verifyTogglApiToken = async (token: string) => {
  const result = await fetch(`${TOGGL_API_URL}/me`, {
    headers: {
      Authorization: `Basic ${btoa(`${token}:api_token`)}`,
    },
  });
  return result.status === 200;
};

export const useToggl = (token: string) => {
  const headers = {
    Authorization: `Basic ${btoa(`${token}:api_token`)}`,
  };
  const get = async (path: string) =>
    await fetch(`${TOGGL_API_URL}${path}`, { headers: { ...headers } });
  const post = async (path: string, body?: string) => {
    return await fetch(`${TOGGL_API_URL}${path}`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body,
    });
  };
  const put = async (path: string, body?: string) => {
    return await fetch(`${TOGGL_API_URL}${path}`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body,
    });
  };

  const getWorkspaces: () => Promise<Workspace[]> = async () => {
    return (await get("/workspaces")).json();
  };
  const getWorkspaceProjects: (id: number) => Promise<Project[]> = async (
    id
  ) => {
    return (await get(`/workspaces/${id}/projects`)).json();
  };
  const startTimer: (
    description: string,
    pid?: number
  ) => Promise<Response<TimeEntry>> = async (description, pid) => {
    return (
      await post(
        "/time_entries/start",
        JSON.stringify({
          time_entry: {
            description,
            pid,
            created_with: "habitify",
            tags: [],
          },
        })
      )
    ).json();
  };
  const stopTimer: (id: number) => Promise<Response<TimeEntry>> = async (
    id
  ) => {
    return (await put(`/time_entries/${id}/stop`)).json();
  };
  const getCurrentTimer: () => Promise<Response<TimeEntry>> = async () => {
    return (await get("/time_entries/current")).json();
  };

  return {
    getWorkspaces,
    getWorkspaceProjects,
    startTimer,
    stopTimer,
    getCurrentTimer,
  };
};
