export interface Task {
  status: "work" | "out";
  text: string;
  date?: Date;
}

export const postKey = () => ["post"];
export const taskKey = (id: number) => ["task", id];
