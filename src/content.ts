import { debounce } from "ts-debounce";
import browser from "webextension-polyfill";
import { notNull, retry } from "./utils";
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
  return retry(() => document.querySelector<HTMLElement>("#root > div"));
};

const getHabitLists = async () => {
  const todo = await retry(() =>
    document.querySelector<HTMLElement>(
      "#root > div > div.main-journal > div.css-wdd64 > div.css-11btfhh > div.css-0"
    )
  );
  const done = await retry(() =>
    document.querySelector<HTMLElement>(
      "#root > div > div.main-journal > div.css-wdd64 > div.css-11btfhh > div:nth-child(2) > div.css-0 > div.chakra-collapse > div.css-0"
    )
  );
  const skip = await retry(() =>
    document.querySelector<HTMLElement>(
      "#root > div > div.main-journal > div.css-wdd64 > div.css-11btfhh > div:nth-child(3) > div.css-0 > div.chakra-collapse > div.css-0"
    )
  );
  return [todo, done, skip].filter(notNull);
};

const createTogglButton = (onclick: (e: MouseEvent) => void) => {
  const button = document.createElement("div");
  button.className = "toggl-button";
  button.onclick = onclick;
  return button;
};

const appendTogglButton = ($item: HTMLElement) => {
  if ($item.querySelector(".toggl-button")) return;
  const $info = $item.querySelector(".item-habit-info");
  $info?.insertBefore(
    createTogglButton((e) => {
      e.preventDefault();
      e.stopPropagation();
      const habit = $item.querySelector(":scope > div")?.id;
      const description = $item.querySelector(".habit-name")?.textContent;
      if (!habit || !description) {
        console.log("Failed to get habit or description: ", habit, description);
        return;
      }
      startTimer(description, habit);
    }),
    $item.querySelector(".css-515xy0")
  );
};

const appendTogglButtons = debounce(async ($lists: HTMLElement[]) => {
  for (const $list of $lists) {
    const $items = $list.querySelectorAll<HTMLElement>(":scope > div");
    for (const $item of $items) {
      appendTogglButton($item);
    }
  }
});

const setupHabitListObserver = debounce(async () => {
  const $lists = await getHabitLists();
  appendTogglButtons($lists);
  const observer = new MutationObserver(() => appendTogglButtons($lists));
  for (const $list of $lists) {
    observer.observe($list, { childList: true });
  }
});

const setupRootObserver = debounce(async () => {
  setupHabitListObserver();
  const $root = await getRoot();
  if (!$root) return;
  const observer = new MutationObserver(() => setupHabitListObserver());
  observer.observe($root, { childList: true });
});

const initialize = async () => {
  try {
    await verifyTogglApiToken();
    await verifyHabitifyApiToken();
    await setupRootObserver();
  } catch (e) {
    console.error(e);
  }
};

void initialize();
