import { browser } from "webextension-polyfill-ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function verifyTogglApiToken() {
  while (true) {
    const isVerified = await browser.runtime.sendMessage({
      type: "verify",
    } as VerifyMessage);
    if (isVerified) break;

    const token = prompt("Input Toggl API Token") ?? "";
    await browser.runtime.sendMessage({ type: "token", token } as TokenMessage);
  }
}

async function makeGetCategoryByHabit() {
  const map = new Map<string, string>();

  // wait for loading
  await sleep(3000);

  // open category modal
  document
    .querySelector(".scroll-left > li:nth-child(7) > a")
    ?.dispatchEvent(new MouseEvent("click"));

  await sleep(500);
  const $categories = document.querySelectorAll(".modal-body > div");
  $categories.forEach(($category) => {
    const category = $category.querySelector<HTMLInputElement>("form > input")
      ?.value;
    const $habits = $category.querySelectorAll(".list-group-item");
    $habits.forEach(($habit) => {
      const habit = $habit.textContent?.trim();
      if (habit && category) map.set(habit, category);
    });
  });

  // close category modal
  document.querySelector(".btn-close")?.dispatchEvent(new MouseEvent("click"));

  return (habit: string) => map.get(habit);
}

async function startTimer(description: string, project: string) {
  await browser.runtime.sendMessage({
    type: "timer",
    description,
    project,
  } as TimerMessage);
}

async function initializeEventListener() {
  const getCategoryByHabit = await makeGetCategoryByHabit();

  const $list = document.getElementById("dashboard-habit-list");
  if (!$list) throw "#dashboard-habit-list is not found";

  const appendTogglButtons = () => {
    const $habits = $list.querySelectorAll(".habit-item");
    $habits.forEach(($habit) => {
      const habit = $habit.querySelector(".habit-name")?.textContent?.trim();
      if (!habit) return;
      const category = getCategoryByHabit(habit) ?? "";
      const $actions = $habit.querySelector(".habit-actions");
      if ($actions && $actions.children.length <= 3) {
        const $toggl = document.createElement("span");
        $toggl.className = "action-item";
        $toggl.textContent = "Toggl";
        $toggl.addEventListener("click", async () => {
          await startTimer(habit, category);
        });
        $actions.appendChild($toggl);
      }
    });
  };
  appendTogglButtons();
  $list.addEventListener("DOMSubtreeModified", appendTogglButtons);
}

(async () => {
  await verifyTogglApiToken();
  await initializeEventListener();
})();
