import { browser } from "webextension-polyfill-ts";

browser.runtime.sendMessage("Hello");
