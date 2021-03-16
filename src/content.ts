import { debounce } from "ts-debounce";
import { browser } from "webextension-polyfill-ts";
import { wait } from "./utils";

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

function appendTogglButtonStyle() {
  const style = document.createElement("style");
  const css = `
.toggl-button {
  position: absolute;
  width: 40px;
  height: 40px;
  right: 30px;
  background: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTAgMkMwIC45LjguNSAxLjcgMWw5LjYgNmMuOS41LjkgMS41IDAgMmwtOS42IDZjLS45LjUtMS43LjEtMS43LTFWMnoiIGZpbGw9IiM5NTg5OWIiLz48L3N2Zz4=") 55% 50% / 20px no-repeat;
  opacity: 0.2;
}
.toggl-button:hover {
  opacity: 0.8;
}
`;
  style.append(document.createTextNode(css));
  document.getElementsByTagName("head")[0].appendChild(style);
}

function createTogglButton(onclick: (e: MouseEvent) => void) {
  const button = document.createElement("div");
  button.className = "toggl-button";
  button.onclick = onclick;
  return button;
}

async function initialize() {
  appendTogglButtonStyle();

  const $main = await wait(() => document.querySelector(".v-main__wrap"));

  const appendTogglButtons = debounce(() => {
    const $items = document.querySelectorAll<HTMLLinkElement>(
      ".journal-habit-item__content"
    );
    for (const $item of $items) {
      for (const $btn of $item.querySelectorAll(".toggl-button")) {
        $btn.remove();
      }
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
  }, 100);

  const setupObserverOnContainer = debounce(async () => {
    const $container = await wait(() =>
      document.querySelector(".v-virtual-scroll__container")
    );
    const observer = new MutationObserver(appendTogglButtons);
    observer.observe($container, { childList: true });
    appendTogglButtons();
  });

  const observer = new MutationObserver(setupObserverOnContainer);
  observer.observe($main, { childList: true });
  setupObserverOnContainer();
}

(async () => {
  await verifyTogglApiToken();
  await verifyHabitifyApiToken();
  await initialize();
})();
