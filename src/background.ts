import { Project, Response, TimeEntry, Workspace } from "toggl";
import { browser } from "webextension-polyfill-ts";

const TOGGL_API_URL = "https://api.track.toggl.com/api/v8";
const KEY = "toggl_api_token";

async function verifyTogglApiToken(token: string) {
  const result = await fetch(`${TOGGL_API_URL}/me`, {
    headers: {
      Authorization: `Basic ${btoa(`${token}:api_token`)}`,
    },
  });
  return result.status === 200;
}

const projectMap = new Map<string, Project>();
async function initializeProjectMap(token: string) {
  const apis = await makeApis(token);
  const workspaces = await apis.getWorkspaces();
  workspaces.forEach(async (workspace) => {
    const projects = await apis.getWorkspaceProjects(workspace.id);
    projects.forEach((project) => {
      projectMap.set(project.name, project);
    });
  });
}
async function makeGetProjectByName() {
  return (name: string) => projectMap.get(name);
}

async function makeApis(token: string) {
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

browser.runtime.onMessage.addListener(async (message: Message) => {
  if (message.type === "verify") {
    const token = (await browser.storage.local.get(KEY))[KEY];
    if (typeof token !== "string") return false;
    if (await verifyTogglApiToken(token)) {
      await initializeProjectMap(token);
      return true;
    }
    return false;
  } else if (message.type === "token") {
    await browser.storage.local.set({ [KEY]: message.token });
  } else if (message.type === "timer") {
    const token = (await browser.storage.local.get(KEY))[KEY];
    if (typeof token !== "string") return false;
    const getProjectByName = await makeGetProjectByName();
    const apis = await makeApis(token);
    await apis.startTimer(
      message.description,
      getProjectByName(message.project)?.id
    );
    return true;
  }
});
