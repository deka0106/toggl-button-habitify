import { debounce } from "ts-debounce";
import browser from "webextension-polyfill";
import { notNull, retry } from "./utils";
import "./style.css";

const verifyTogglApiToken = async () => {
  while (true) {
    const isVerified = await browser.runtime.sendMessage({
      type: "verify_toggl",
    } as VerifyTogglMessage);
    if (isVerified) break;

    const token = prompt("Input Toggl API Token") ?? "";
    await browser.runtime.sendMessage({
      type: "token_toggl",
      token,
    } as TokenTogglMessage);
  }
};

const verifyHabitifyApiToken = async () => {
  while (true) {
    const isVerified = await browser.runtime.sendMessage({
      type: "verify_habitify",
    } as VerifyHabitifyMessage);
    if (isVerified) break;

    const token = prompt("Input Habitify API Token") ?? "";
    await browser.runtime.sendMessage({
      type: "token_habitify",
      token,
    } as TokenHabitifyMessage);
  }
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

const getMainContainer = async () => {
  return retry(() =>
    document.querySelector<HTMLElement>(
      "#root > div.css-jdbdwd > div.css-76h34y > div.css-y3isu0 > div.css-11btfhh"
    )
  );
};

const getHabitLists = async () => {
  const todo = await retry(() =>
    document.querySelector<HTMLElement>(
      "#root > div.css-jdbdwd > div.css-76h34y > div.css-y3isu0 > div.css-11btfhh > div.css-0"
    )
  );
  const done = await retry(() =>
    document.querySelector<HTMLElement>(
      "#root > div.css-jdbdwd > div.css-76h34y > div.css-y3isu0 > div.css-11btfhh > div:nth-child(4) > div.css-0 > div.chakra-collapse > div.css-0"
    )
  );
  return [todo, done].filter(notNull);
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
  $info?.append(
    createTogglButton((e) => {
      e.preventDefault();
      e.stopPropagation();
      const habit = $item.querySelector(":scope > div")?.id;
      const description = $item.querySelector(
        ".item-habit-info .chakra-text"
      )?.textContent;
      if (!habit || !description) {
        console.log("Failed to get habit or description: ", habit, description);
        return;
      }
      startTimer(description, habit);
    })
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
  const observer = new MutationObserver(() => appendTogglButtons($lists));
  for (const $list of $lists) {
    observer.observe($list, { childList: true });
  }
  appendTogglButtons($lists);
});

const setupMainContainerObserver = debounce(async () => {
  const $container = await getMainContainer();
  if (!$container) return;
  const observer = new MutationObserver(setupHabitListObserver);
  observer.observe($container, { childList: true });
  setupHabitListObserver();
});

const setupRootObserver = debounce(async () => {
  const $root = await getRoot();
  if (!$root) return;
  const observer = new MutationObserver(setupHabitListObserver);
  observer.observe($root, { childList: true });
  setupMainContainerObserver();
});

const initialize = async () => {
  await verifyTogglApiToken();
  await verifyHabitifyApiToken();
  await setupRootObserver();
};

void initialize();
