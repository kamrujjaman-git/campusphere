"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpenseCategory } from "@/types/expense";

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
  const receiptFile = formData.get("receipt") as File | null;

  if (!title || !category || !amount || amount <= 0) {
    throw new Error("Please fill in all required fields correctly.");
  }

  let receiptUrl: string | null = null;

  if (receiptFile && receiptFile.size > 0) {
    const fileExt = receiptFile.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, receiptFile);

    if (uploadError) {
      throw new Error(`Receipt upload failed: ${uploadError.message}`);
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
