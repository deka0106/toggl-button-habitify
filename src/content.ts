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

function createTogglButton(onclick: (e: MouseEvent) => void) {
  const button = document.createElement("div");
  button.className = "toggl-button";
  button.onclick = onclick;
  return button;
}

const appendTogglButtons = debounce(async () => {
  const $items = document.querySelectorAll<HTMLLinkElement>(
    ".journal-habit-item__content"
  );
  for (const $item of $items) {
    if ($item.querySelector(".toggl-button")) continue;
    $item.prepend(
      createTogglButton((e) => {
        e.preventDefault();
        const description =
          $item.querySelector(".journal-habit-name")?.textContent ?? "";
        const habit = $item.href.substring($item.href.lastIndexOf("/") + 1);
        startTimer(description, habit);
      })
    );
  }
});

const setupObserverOnContainer = debounce(async () => {
  const $container = await wait(() =>
    document.querySelector(".v-virtual-scroll__container")
  );
  const observer = new MutationObserver(appendTogglButtons);
  observer.observe($container, { childList: true });
  appendTogglButtons();
});

async function initialize() {
  const $main = await wait(() => document.querySelector(".v-main__wrap"));
  const observer = new MutationObserver(setupObserverOnContainer);
  observer.observe($main, { childList: true });
  setupObserverOnContainer();
}

(async () => {
  await verifyTogglApiToken();
  await verifyHabitifyApiToken();
  await initialize();
})();
