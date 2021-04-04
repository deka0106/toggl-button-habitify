import { Project } from "toggl";
import { browser } from "webextension-polyfill-ts";
import { useHabitify, verifyHabitifyApiToken } from "./habitify";
import { useToggl, verifyTogglApiToken } from "./toggl";

const TOGGL_KEY = "toggl_api_token";
const HABITIFY_KEY = "habitify_api_token";

const projectMap = new Map<string, Project>();
async function getProjectByName(name: string) {
  if (projectMap.size === 0) {
    const toggl = await useToggl(await getTogglApiToken());
    const workspaces = await toggl.getWorkspaces();
    for (const workspace of workspaces) {
      const projects = await toggl.getWorkspaceProjects(workspace.id);
      for (const project of projects) {
        projectMap.set(project.name, project);
      }
    }
  }
  return projectMap.get(name);
}

async function getTogglApiToken() {
  const token = (await browser.storage.local.get(TOGGL_KEY))[TOGGL_KEY];
  if (typeof token !== "string") throw "Toggl API Token is empty";
  return token;
}

async function getHabitifyApiToken() {
  const token = (await browser.storage.local.get(HABITIFY_KEY))[HABITIFY_KEY];
  if (typeof token !== "string") throw "Habitify API Token is empty";
  return token;
}

async function processVerifyTogglMessage(_: VerifyTogglMessage) {
  try {
    return await verifyTogglApiToken(await getTogglApiToken());
  } catch {
    return false;
  }
}

async function processVerifyHabitifyMessage(_: VerifyHabitifyMessage) {
  try {
    return await verifyHabitifyApiToken(await getHabitifyApiToken());
  } catch {
    return false;
  }
}

async function processTokenTogglMessage(message: TokenTogglMessage) {
  return await browser.storage.local.set({ [TOGGL_KEY]: message.token });
}

async function processTokenHabitifyMessage(message: TokenHabitifyMessage) {
  return await browser.storage.local.set({ [HABITIFY_KEY]: message.token });
}

async function processTimerMessage(message: TimerMessage) {
  const habitify = await useHabitify(await getHabitifyApiToken());
  const habit = await habitify.getHabit(message.habit);
  const project = await getProjectByName(habit?.area?.name ?? "");
  console.log(
    "startTimer:",
    message.description,
    `(${project?.id}: ${habit?.area?.name})`
  );
  const toggl = await useToggl(await getTogglApiToken());
  return await toggl.startTimer(message.description, project?.id);
}

browser.runtime.onMessage.addListener(async (message: Message) => {
  if (message.type === "verify_toggl") {
    return await processVerifyTogglMessage(message);
  } else if (message.type === "verify_habitify") {
    return await processVerifyHabitifyMessage(message);
  } else if (message.type === "token_toggl") {
    return await processTokenTogglMessage(message);
  } else if (message.type === "token_habitify") {
    return await processTokenHabitifyMessage(message);
  } else if (message.type === "timer") {
    return await processTimerMessage(message);
  }
});
