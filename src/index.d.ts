interface IMessage {
  type: string;
}
interface VerifyTogglMessage extends IMessage {
  type: "verify_toggl";
}
interface VerifyHabitifyMessage extends IMessage {
  type: "verify_habitify";
}
interface TokenTogglMessage extends IMessage {
  type: "token_toggl";
  token: string;
}
interface TokenHabitifyMessage extends IMessage {
  type: "token_habitify";
  token: string;
}
interface TimerMessage extends IMessage {
  type: "timer";
  description: string;
  habit: string;
}
type Message =
  | VerifyTogglMessage
  | VerifyHabitifyMessage
  | TokenTogglMessage
  | TokenHabitifyMessage
  | TimerMessage;

declare module "toggl" {
  interface Response<T> {
    data: T;
  }

  interface Workspace {
    id: number;
    name: string;
    premium: boolean;
    admin: boolean;
    default_hourly_rate: number;
    default_currency: string;
    only_admins_may_create_projects: boolean;
    only_admins_see_billable_rates: boolean;
    rounding: number;
    rounding_minutes: number;
    at: string; // Date
    logo_url: string;
  }

  interface Project {
    id: number;
    wid: number;
    cid: number;
    name: string;
    billable: boolean;
    is_private: boolean;
    active: boolean;
    at: string; // Date
    template_id: number;
    color: string;
  }

  interface TimeEntry {
    id: number;
    pid: number;
    wid: number;
    billable: boolean;
    start: string; // Date
    duration: number;
    description: string;
    tags: string[];
  }
}

declare module "habitify" {
  interface Response<T> {
    message: string;
    status: boolean;
    version: string;
    data: T;
  }

  interface Habit {
    id: string;
    name: string;
    is_archived: boolean;
    start_date: string; // Date
    time_of_day: TimeOfDay;
    area?: {
      id: string;
      name: string;
      priority: string;
    };
    recurrence: string;
    created_date: string; // Date
    goal?: object; // Goal
    log_method: string; // LogMethod
    priority: number;
    status?: object; // Status
    progress?: object;
  }

  interface Area {
    id: string;
    name: string;
    created_date: string; // Date
  }

  enum TimeOfDay {
    morning = "morning",
    evening = "evening",
    afternoon = "afternoon",
    any_time = "any_time",
  }
}
