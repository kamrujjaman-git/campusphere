"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpenseCategory } from "@/types/expense";

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;
const RECEIPT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

async function requireAdminOrTreasurer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin" && profile?.role !== "treasurer") {
    throw new Error("Only admins or treasurers can do this.");
  }

  return { supabase, userId: user.id };
}

export async function createExpense(formData: FormData) {
  const { supabase, userId } = await requireAdminOrTreasurer();

  const title = formData.get("title") as string;
  const category = formData.get("category") as ExpenseCategory;
  const amount = parseFloat(formData.get("amount") as string);
  const expenseDate = formData.get("expense_date") as string;
  const receiptEntry = formData.get("receipt");
  const receiptFile = receiptEntry instanceof File ? receiptEntry : null;

  if (!title || !category || !amount || amount <= 0) {
    throw new Error("Please fill in all required fields correctly.");
  }

  let receiptUrl: string | null = null;

  if (receiptEntry && !receiptFile) {
    throw new Error("The receipt upload is invalid.");
  }

  if (receiptFile) {
    if (receiptFile.size === 0) {
      throw new Error("The receipt file is empty.");
    }

    if (receiptFile.size > MAX_RECEIPT_SIZE) {
      throw new Error("The receipt file must be 5 MB or smaller.");
    }

    const fileExt = receiptFile.name.split(".").pop()?.toLowerCase() ?? "";
    const expectedType = RECEIPT_TYPES[fileExt];

    if (!expectedType || receiptFile.type !== expectedType) {
      throw new Error("Receipt must be a JPEG, PNG, WEBP image, or PDF.");
    }

    const fileName = `${userId}-${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, receiptFile);

    if (uploadError) {
      throw new Error(`Receipt upload failed. ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);

    receiptUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabase.from("expenses").insert({
    title,
    category,
    amount,
    expense_date: expenseDate || new Date().toISOString().split("T")[0],
    receipt_url: receiptUrl,
    spent_by: userId,
    approved_by: userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function deleteExpense(expenseId: string) {
  const { supabase } = await requireAdminOrTreasurer();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) throw new Error(error.message);

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}
