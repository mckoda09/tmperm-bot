import { type OrderStatus, resetPostDate, updatePostStatus } from "./db.ts";
import { Composer, InlineKeyboard } from "grammy";
import { updateList } from "./list.ts";
import { kv } from "./mod.ts";

// Status names
const statusEnum = {
  work: "🛠️ В работе",
  out: "📤 На выдаче",
  recent: "🕒 Недавно выданный",
};

// Generate keyboard
export const generateKeyboard = (id: number, status: OrderStatus) => {
  const keyboard = new InlineKeyboard();

  switch (status) {
    case "work":
      keyboard.text("Готов →", `out-${id}`).row();
      break;
    case "out":
      keyboard
        .text("← В работу", `work-${id}`).row()
        .text(
          "Выдать →",
          `recent-${id}`,
        ).row();
      break;
    case "recent":
      keyboard.text("← На выдачу", `out-${id}`).row();
      break;
  }

  keyboard.text("Сбросить дату", `reset-${id}`);

  return keyboard;
};

// Generate text above keyboard XD
export const generateText = (status: OrderStatus) => {
  return statusEnum[status];
};

export const keyboardComposer = new Composer();

// Status changes
keyboardComposer.callbackQuery(/work-[0-9]+/, async (ctx) => {
  const postId = Number(ctx.callbackQuery.data.split("-")[1]);
  await updatePostStatus(postId, "work");
  await ctx.editMessageText(generateText("work"), {
    reply_markup: generateKeyboard(postId, "work"),
  });
  await updateList();
  await ctx.answerCallbackQuery({ text: "Заказ-наряд теперь в работе!" });
});

keyboardComposer.callbackQuery(/out-[0-9]+/, async (ctx) => {
  const postId = Number(ctx.callbackQuery.data.split("-")[1]);
  await updatePostStatus(postId, "out");
  await ctx.editMessageText(generateText("out"), {
    reply_markup: generateKeyboard(postId, "out"),
  });
  await updateList();
  await ctx.answerCallbackQuery({ text: "Заказ-наряд теперь на выдаче!" });
});

keyboardComposer.callbackQuery(/recent-[0-9]+/, async (ctx) => {
  const postId = Number(ctx.callbackQuery.data.split("-")[1]);
  await updatePostStatus(postId, "recent");
  await ctx.editMessageText(generateText("recent"), {
    reply_markup: generateKeyboard(postId, "recent"),
  });
  await updateList();
  await requestRecentDelete(postId); // ESPECIALLY FOR RECENT WE REQUEST DELETION
  await ctx.answerCallbackQuery({ text: "Заказ-наряд выдан!" });
});

keyboardComposer.callbackQuery(/reset-[0-9]+/, async (ctx) => {
  const postId = Number(ctx.callbackQuery.data.split("-")[1]);
  await resetPostDate(postId);
  try {
    await updateList();
    await ctx.answerCallbackQuery({ text: "Дата заказ-наряда сброшена!" });
  } catch {
    await ctx.answerCallbackQuery({ text: "Дата заказ-наряда уже текущая!" });
  }
});

// hehe
const requestRecentDelete = async (postId: number) => {
  await kv.enqueue(postId, { delay: 3 * 24 * 60 * 60 * 1000 });
};
