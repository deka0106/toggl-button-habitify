import { Response, Project, TimeEntry, Workspace } from "toggl";

const TOGGL_API_URL = "https://api.track.toggl.com/api/v8";

export async function verifyTogglApiToken(token: string) {
  const result = await fetch(`${TOGGL_API_URL}/me`, {
    headers: {
      Authorization: `Basic ${btoa(`${token}:api_token`)}`,
    },
  });
  return result.status === 200;
}

export function useToggl(token: string) {
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

  return {
    getWorkspaces,
    getWorkspaceProjects,
    startTimer,
  };
}
