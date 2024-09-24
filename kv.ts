export const kv = await Deno.openKv();

export const addTask = async (messageId: number, text: string) => {
  const entryKey = ["task", messageId];

  await kv.set(entryKey, text);
};

export const removeTask = async (messageId: number) => {
  const entryKey = ["task", messageId];
  await kv.delete(entryKey);
};

export const listTasks = async () => {
  const iter = kv.list<string>({ prefix: ["task"] });
  const entries = await Array.fromAsync(iter);

  return entries;
};
