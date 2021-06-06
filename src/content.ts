import { debounce } from "ts-debounce";
import { browser } from "webextension-polyfill-ts";
import { wait } from "./utils";
import "./style.css";

async function verifyTogglApiToken() {
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
}

async function verifyHabitifyApiToken() {
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
}

async function startTimer(description: string, habit: string) {
  await browser.runtime.sendMessage({
    type: "timer",
    description,
    habit,
  } as TimerMessage);
}

async function getRoot() {
  return wait(() => document.querySelector("#root"));
}

async function getHabitContainers() {
  const todo = await wait(() =>
    document.querySelector<HTMLElement>(
      "#root > div > div.css-76h34y > div.css-y3isu0 > div.css-1mwek1r > div.css-0"
    )
  );
  const done = await wait(() =>
    document.querySelector<HTMLElement>(
      "#root > div > div.css-76h34y > div.css-y3isu0 > div.css-1mwek1r > div:nth-child(4) > div > div.chakra-collapse > div"
    )
  );
  return [todo, done];
}

function createTogglButton(onclick: (e: MouseEvent) => void) {
  const button = document.createElement("div");
  button.className = "toggl-button";
  button.onclick = onclick;
  return button;
}

function appendTogglButton($item: HTMLElement) {
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
}

const appendTogglButtons = debounce(async ($containers: HTMLElement[]) => {
  for (const $container of $containers) {
    const $items = $container.querySelectorAll<HTMLElement>(":scope > div");
    for (const $item of $items) {
      appendTogglButton($item);
    }
  }
});

const setupObserverOnContainers = debounce(async () => {
  const $containers = await getHabitContainers();
  const observer = new MutationObserver(() => appendTogglButtons($containers));
  for (const $container of $containers) {
    observer.observe($container, { childList: true });
  }
  appendTogglButtons($containers);
});

async function initialize() {
  const $root = await getRoot();
  const observer = new MutationObserver(setupObserverOnContainers);
  observer.observe($root, { childList: true });
  setupObserverOnContainers();
}

(async () => {
  await verifyTogglApiToken();
  await verifyHabitifyApiToken();
  await initialize();
})();
