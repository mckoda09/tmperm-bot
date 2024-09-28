export interface Task {
  status: "work" | "out";
  text: string;
}

export const postKey = () => ["post"];
export const taskKey = (id: number) => ["task", id];
