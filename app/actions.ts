"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Address, CartLine } from "@/lib/types";

async function requireUser() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in");
  return { supabase, userId: user.id };
}

export interface CreateListingInput {
  personName: string;
  personBio: string | null;
  photoUrl: string | null;
  title: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  tags: string[];
  availability: string | null;
  existingPersonId?: string;
}

export async function createListing(
  input: CreateListingInput
): Promise<{ ok: true; listingId: string } | { ok: false; error: string }> {
  try {
    const { supabase, userId } = await requireUser();

    const title = input.title.trim();
    const unit = input.unit.trim().toLowerCase();
    if (title.length < 3) return { ok: false, error: "Describe the offering (min 3 characters)." };
    if (!Number.isFinite(input.price) || input.price < 0 || input.price > 10_000_000)
      return { ok: false, error: "Price must be between ₹0 and ₹1 crore." };
    if (unit.length < 1 || unit.length > 24)
      return { ok: false, error: "Pick a sensible unit." };

    let personId = input.existingPersonId;

    if (!personId) {
      const name = input.personName.trim();
      if (name.length < 2) return { ok: false, error: "Every human needs a name." };

      // unique slug — append -2, -3 … when taken
      const base = slugify(name);
      let slug = base;
      for (let i = 2; ; i++) {
        const { data } = await supabase
          .from("people")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!data) break;
        slug = `${base}-${i}`;
        if (i > 200) return { ok: false, error: "Too many humans with this name." };
      }

      const { data: person, error: personErr } = await supabase
        .from("people")
        .insert({
          name,
          slug,
          bio: input.personBio?.trim() || null,
          photo_url: input.photoUrl,
          created_by: userId,
        })
        .select("id")
        .single();
      if (personErr) throw new Error(personErr.message);
      personId = person.id;
    }

    const { data: listing, error: listingErr } = await supabase
      .from("listings")
      .insert({
        person_id: personId,
        title,
        description: input.description?.trim() || null,
        price: Math.round(input.price),
        unit,
        category: input.category,
        tags: input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8),
        availability: input.availability?.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (listingErr) throw new Error(listingErr.message);

    revalidatePath("/explore");
    revalidatePath("/");
    return { ok: true, listingId: listing.id };
  } catch (err) {
    console.error("createListing:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}

export async function placeOrder(input: {
  address: Address;
  items: CartLine[];
  paymentMethod: string;
}): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  try {
    const { supabase, userId } = await requireUser();

    if (!input.items.length) return { ok: false, error: "Your cart is empty." };
    if (!input.address.fullName?.trim() || !input.address.line1?.trim() ||
        !input.address.city?.trim() || !input.address.state?.trim() ||
        !/^\d{6}$/.test(input.address.pincode ?? ""))
      return { ok: false, error: "The address is incomplete." };

    // re-price every line from the database — never trust the client
    const ids = input.items.map((i) => i.listingId);
    const { data: dbListings, error: fetchErr } = await supabase
      .from("market_listings")
      .select("id, title, unit, price, person_name, person_slug, person_photo_url")
      .in("id", ids)
      .eq("is_active", true);
    if (fetchErr) throw new Error(fetchErr.message);

    const byId = new Map(dbListings.map((l) => [l.id, l]));
    const items: CartLine[] = [];
    for (const line of input.items) {
      const db = byId.get(line.listingId);
      if (!db) continue; // listing vanished mid-checkout — drop it
      items.push({
        listingId: db.id,
        title: db.title,
        unit: db.unit,
        price: db.price,
        qty: Math.max(1, Math.min(99, Math.round(line.qty))),
        personName: db.person_name,
        personSlug: db.person_slug,
        photoUrl: db.person_photo_url,
      });
    }
    if (!items.length) return { ok: false, error: "Those listings are no longer available." };

    // same formula as the client, computed server-side
    const subtotal = items.reduce((s, l) => s + l.price * l.qty, 0);
    const humanTouch = subtotal >= 500 ? Math.round(subtotal * 0.1) : 0;
    const serviceFee = items.reduce((s, l) => s + l.qty, 0) * 9;
    const totals = {
      subtotal,
      humanTouch,
      serviceFee,
      total: Math.max(0, subtotal - humanTouch + serviceFee),
    };

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        buyer_id: userId,
        address: input.address,
        items,
        totals,
        payment_method: input.paymentMethod,
        status: "completed", // simulated payment — always completes
      })
      .select("id")
      .single();
    if (orderErr) throw new Error(orderErr.message);

    return { ok: true, orderId: order.id };
  } catch (err) {
    console.error("placeOrder:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "The payment ritual failed.",
    };
  }
}

export async function submitReview(input: {
  listingId: string;
  rating: number;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase, userId } = await requireUser();
    const rating = Math.round(input.rating);
    const body = input.body.trim();
    if (rating < 1 || rating > 5) return { ok: false, error: "Pick a rating from 1 to 5." };
    if (body.length < 4) return { ok: false, error: "Say a little more than that." };

    // one review per author per listing — replace on conflict
    const { error } = await supabase.from("reviews").upsert(
      { listing_id: input.listingId, author_id: userId, rating, body },
      { onConflict: "listing_id,author_id" }
    );
    if (error) throw new Error(error.message);

    revalidatePath(`/listing/${input.listingId}`);
    return { ok: true };
  } catch (err) {
    console.error("submitReview:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not submit the review.",
    };
  }
}

export async function setListingActive(
  listingId: string,
  active: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("listings")
      .update({ is_active: active })
      .eq("id", listingId);
    if (error) throw new Error(error.message);
    revalidatePath("/account");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed." };
  }
}

export async function deleteListing(listingId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("listings").delete().eq("id", listingId);
    if (error) throw new Error(error.message);
    revalidatePath("/account");
    revalidatePath("/explore");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }
}

export async function reportListing(input: {
  listingId?: string;
  personId?: string;
  reason: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId } = await requireUser();
    const reason = input.reason.trim();
    if (reason.length < 3) return { ok: false, error: "Tell us briefly what's wrong." };
    const { error } = await supabase.from("reports").insert({
      listing_id: input.listingId ?? null,
      person_id: input.personId ?? null,
      reporter_id: userId,
      reason,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Report failed." };
  }
}
