import { debounce } from "ts-debounce";
import browser from "webextension-polyfill";
import { retry } from "./utils";
import "./style.css";

const RETRY_COUNT = 3;

const verifyTogglApiToken = async () => {
  const isVerified = await browser.runtime.sendMessage({
    type: "verify_toggl",
  } as VerifyTogglMessage);
  if (isVerified) return;

  for (let i = 0; i < RETRY_COUNT; i++) {
    const token = prompt("Input Toggl API Token") ?? "";
    await browser.runtime.sendMessage({
      type: "token_toggl",
      token,
    } as TokenTogglMessage);
    const isVerified = await browser.runtime.sendMessage({
      type: "verify_toggl",
    } as VerifyTogglMessage);
    if (isVerified) return;
  }
  throw new Error("Failed to verify Toggl API Token");
};

const verifyHabitifyApiToken = async () => {
  const isVerified = await browser.runtime.sendMessage({
    type: "verify_habitify",
  } as VerifyHabitifyMessage);
  if (isVerified) return;

  for (let i = 0; i < RETRY_COUNT; i++) {
    const token = prompt("Input Habitify API Token") ?? "";
    await browser.runtime.sendMessage({
      type: "token_habitify",
      token,
    } as TokenHabitifyMessage);
    const isVerified = await browser.runtime.sendMessage({
      type: "verify_habitify",
    } as VerifyHabitifyMessage);
    if (isVerified) return;
  }
  throw new Error("Failed to verify Habitify API Token");
};

const startTimer = async (description: string, habit: string) => {
  await browser.runtime.sendMessage({
    type: "timer",
    description,
    habit,
  } as TimerMessage);
};

const getRoot = async () => {
  return retry(() => document.querySelector<HTMLElement>("#root"));
};

const getHabitElements = async () => {
  return await retry(() =>
    document.querySelectorAll<HTMLElement>(".item-habit-info")
  );
};

let pending = 0;
const showNotification = (message: string) => {
  const notification = document.querySelector("#toggl-notification");
  if (!notification) return;
  notification.textContent = message;
  notification.classList.add("show");
  pending++;
  setTimeout(() => {
    pending--;
    if (pending === 0) {
      notification.classList.remove("show");
    }
  }, 5000);
};

const createTogglButton = (onclick: (e: MouseEvent) => void) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "toggl-button";
  button.onclick = onclick;
  return button;
};

const appendTogglButton = (item: HTMLElement) => {
  if (item.querySelector(".toggl-button")) return;
  item.insertBefore(
    createTogglButton((e) => {
      e.preventDefault();
      e.stopPropagation();
      const habit = item.parentElement?.id;
      const description = item.querySelector(".habit-name")?.textContent;
      if (!habit || !description) {
        console.log("Failed to get habit or description: ", habit, description);
        return;
      }
      startTimer(description, habit).then(() => {
        showNotification(description);
      });
    }),
    item.querySelector(".css-0")?.nextSibling ?? null
  );
};

const setupTogglButtons = debounce(async () => {
  const habits = await getHabitElements();
  if (!habits) return;
  for (const habit of habits) {
    appendTogglButton(habit);
  }
});

const setupRootObserver = debounce(async () => {
  const root = await getRoot();
  if (!root) return;
  setupTogglButtons();
  const observer = new MutationObserver(() => setupTogglButtons());
  observer.observe(root, { childList: true, subtree: true });
});

const setupNotification = () => {
  const notification = document.createElement("div");
  notification.id = "toggl-notification";
  document.body.appendChild(notification);
};

const initialize = async () => {
  try {
    await verifyTogglApiToken();
    await verifyHabitifyApiToken();
    await setupRootObserver();
    setupNotification();
  } catch (e) {
    console.error(e);
  }
};

void initialize();
