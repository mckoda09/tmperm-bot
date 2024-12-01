import { kv } from "./mod.ts";

export type OrderStatus = "new_" | "work" | "out" | "recent";

export interface PostData {
  caption: string;
  status: OrderStatus;
  createdAt: Date;
}

const postDataKey = (id: number) => ["postData", id];

export const setPostData = async (id: number, postData: PostData) => {
  await kv.set(postDataKey(id), postData);
};

export const getPostData = async (id: number) =>
  (await kv.get<PostData>(postDataKey(id))).value;

export const deletePost = async (id: number) =>
  await kv.delete(postDataKey(id));

export const updatePostStatus = async (id: number, status: OrderStatus) => {
  const post = await kv.get<PostData>(postDataKey(id));

  await kv
    .atomic()
    .check(post)
    .set(post.key, { ...post.value, status })
    .commit();
};

export const updatePostCaption = async (id: number, caption: string) => {
  const post = await kv.get<PostData>(postDataKey(id));

  await kv
    .atomic()
    .check(post)
    .set(post.key, { ...post.value, caption })
    .commit();
};

export const resetPostDate = async (id: number) => {
  const post = await kv.get<PostData>(postDataKey(id));
  await kv
    .atomic()
    .check(post)
    .set(post.key, { ...post.value, date: new Date() })
    .commit();
};

export const listPosts = async () => {
  return await Array.fromAsync(
    kv.list<PostData>({ prefix: ["postData"] }),
    (e) => ({ ...e.value, id: Number(e.key[1]) }),
  );
};

const listKey = () => ["list"];

export const setList = async (id: number) => {
  await kv.set(listKey(), id);
};

export const getList = async () => {
  return (await kv.get<number>(listKey())).value;
};
