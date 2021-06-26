import { Response, Area, Habit } from "habitify";

const HABITIFY_API_URL = "https://api.habitify.me";

export const verifyHabitifyApiToken = async (token: string) => {
  const result = await fetch(`${HABITIFY_API_URL}/areas`, {
    headers: {
      Authorization: token,
    },
  });
  return result.status === 200;
};

export const useHabitify = (token: string) => {
  const headers = {
    Authorization: token,
  };
  const get = async (path: string) =>
    await fetch(`${HABITIFY_API_URL}${path}`, { headers: { ...headers } });

  const getAreas: () => Promise<Response<Area[]>> = async () => {
    return (await get("/areas")).json();
  };
  const getHabit: (id: string) => Promise<Response<Habit>> = async (id) => {
    return (await get(`/habits/${id}`)).json();
  };

  return {
    getAreas,
    getHabit,
  };
};
