"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpenseCategory } from "@/types/expense";
import { getTenantContext } from "@/lib/supabase/tenant";

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

  if (
    profile?.role !== "super_admin" &&
    profile?.role !== "admin" &&
    profile?.role !== "treasurer"
  ) {
    throw new Error("Only admins or treasurers can do this.");
  }

  return { supabase, userId: user.id, tenant: await getTenantContext(supabase) };
}

export async function createExpense(formData: FormData) {
  const { supabase, userId, tenant } = await requireAdminOrTreasurer();

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
  let uploadedReceiptName: string | null = null;

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

    uploadedReceiptName = fileName;

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
    community_id: tenant?.communityId,
  });

  if (error) {
    if (uploadedReceiptName) {
      const { error: cleanupError } = await supabase.storage
        .from("receipts")
        .remove([uploadedReceiptName]);

      if (cleanupError) {
        throw new Error(
          `Expense save failed: ${error.message} Receipt cleanup also failed: ${cleanupError.message}`
        );
      }
    }

    throw new Error(`Expense save failed: ${error.message}`);
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function deleteExpense(expenseId: string) {
  const { supabase, tenant } = await requireAdminOrTreasurer();

  let query = supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);
  if (tenant?.communityId && !tenant.isOwner) query = query.eq("community_id", tenant.communityId);
  const { error } = await query;

  if (error) throw new Error(error.message);

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function updateExpense(expenseId: string, formData: FormData) {
  const { supabase, tenant } = await requireAdminOrTreasurer();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const amount = Number(formData.get("amount"));
  const expenseDate = String(formData.get("expense_date") ?? "");
  const validCategories = ["sports_equipment", "venue", "tour", "misc"];

  if (!title || !validCategories.includes(category)) {
    throw new Error("Please provide a valid expense title and category.");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Expense amount must be greater than zero.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    throw new Error("Please provide a valid expense date.");
  }

  let query = supabase
    .from("expenses")
    .update({ title, category, amount, expense_date: expenseDate })
    .eq("id", expenseId);
  if (tenant?.communityId && !tenant.isOwner) query = query.eq("community_id", tenant.communityId);
  const { data, error } = await query.select("id").maybeSingle();

  if (error) throw new Error(`Expense update failed: ${error.message}`);
  if (!data) throw new Error("Expense was not found or could not be updated.");

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}
