interface IMessage {
  type: string;
}
interface VerifyMessage extends IMessage {
  type: "verify";
}
interface TokenMessage extends IMessage {
  type: "token";
  token: string;
}
interface TimerMessage extends IMessage {
  type: "timer";
  description: string;
  project: string;
}
type Message = VerifyMessage | TokenMessage | TimerMessage;

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
