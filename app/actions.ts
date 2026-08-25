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

    // reusing your own person row — apply the new photo/bio instead of
    // silently keeping whatever the first listing saved
    if (personId) {
      const personUpdate: Partial<{ bio: string; photo_url: string }> = {};
      if (input.personBio?.trim()) personUpdate.bio = input.personBio.trim();
      if (input.photoUrl) personUpdate.photo_url = input.photoUrl;
      if (Object.keys(personUpdate).length) {
        const { error: updErr } = await supabase
          .from("people")
          .update(personUpdate)
          .eq("id", personId);
        if (updErr) throw new Error(updErr.message);
      }
    }

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

export interface UpdateListingInput {
  listingId: string;
  title: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  tags: string[];
  availability: string | null;
}

// the lister themselves or an admin can rewrite an offering.
// the human's own details are shared across all their listings — those go
// through updatePerson instead.
export async function updateListing(
  input: UpdateListingInput
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId } = await requireUser();

    const title = input.title.trim();
    const unit = input.unit.trim().toLowerCase();
    if (title.length < 3) return { ok: false, error: "Describe the offering (min 3 characters)." };
    if (!Number.isFinite(input.price) || input.price < 0 || input.price > 10_000_000)
      return { ok: false, error: "Price must be between ₹0 and ₹1 crore." };
    if (unit.length < 1 || unit.length > 24)
      return { ok: false, error: "Pick a sensible unit." };

    const { data: listing, error: fetchErr } = await supabase
      .from("listings")
      .select("id, created_by")
      .eq("id", input.listingId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!listing) return { ok: false, error: "That listing no longer exists." };

    const isOwner = listing.created_by === userId;
    if (!isOwner) {
      const { data: me } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();
      if (!me?.is_admin) return { ok: false, error: "Only the lister or an admin can edit this." };
    }

    const tags = input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8);
    const description = input.description?.trim() || null;
    const availability = input.availability?.trim() || null;

    if (isOwner) {
      // RLS enforces ownership
      const { error: lErr } = await supabase
        .from("listings")
        .update({
          title,
          description,
          price: Math.round(input.price),
          unit,
          category: input.category,
          tags,
          availability,
        })
        .eq("id", input.listingId);
      if (lErr) throw new Error(lErr.message);
    } else {
      const { error: rpcErr } = await supabase.rpc("admin_update_listing", {
        p_listing_id: input.listingId,
        p_title: title,
        p_description: description,
        p_price: Math.round(input.price),
        p_unit: unit,
        p_category: input.category,
        p_tags: tags,
        p_availability: availability,
      });
      if (rpcErr) throw new Error(rpcErr.message);
    }

    revalidatePath(`/listing/${input.listingId}`);
    revalidatePath("/account");
    revalidatePath("/admin");
    revalidatePath("/explore");
    return { ok: true };
  } catch (err) {
    console.error("updateListing:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Update failed." };
  }
}

export interface UpdatePersonInput {
  personId: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  /** admins only — ignored for the creator/claimer, whose URL stays put */
  slug?: string;
}

/**
 * Edit a listed human. The creator or claimer writes straight through RLS;
 * an admin goes via a security-definer RPC and may also move the slug.
 */
export async function updatePerson(
  input: UpdatePersonInput
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId } = await requireUser();

    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: "Every human needs a name." };
    if (name.length > 80) return { ok: false, error: "That name is too long for the shelf." };

    const bio = input.bio?.trim() || null;
    if (bio && bio.length > 140) return { ok: false, error: "Keep the bio to 140 characters." };

    const { data: person, error: fetchErr } = await supabase
      .from("people")
      .select("id, slug, created_by, claimed_by")
      .eq("id", input.personId)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!person) return { ok: false, error: "That human is no longer on the shelf." };

    // mirrors the "people update" RLS policy: creator or claimer
    const isOwner = person.created_by === userId || person.claimed_by === userId;

    // computed unconditionally — an admin is often also the creator (seeded
    // examples), and gating this on !isOwner would silently drop their slug
    // edit while still reporting success
    const { data: me } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    const isAdmin = Boolean(me?.is_admin);

    if (!isOwner && !isAdmin)
      return { ok: false, error: "Only the person who listed them, or an admin, can edit this." };

    if (isAdmin) {
      // renaming never moves the URL on its own — the slug only changes when
      // an admin deliberately types a new one
      const slug = input.slug?.trim().toLowerCase() || person.slug;
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
        return {
          ok: false,
          error: "A URL may only use lowercase letters, numbers and single hyphens.",
        };
      if (slug.length > 60) return { ok: false, error: "That URL is too long." };

      if (slug !== person.slug) {
        const { data: clash } = await supabase
          .from("people")
          .select("id")
          .eq("slug", slug)
          .neq("id", input.personId)
          .maybeSingle();
        if (clash) return { ok: false, error: `The URL /${slug} is already taken.` };
      }

      const { error: rpcErr } = await supabase.rpc("admin_update_person", {
        p_id: input.personId,
        p_name: name,
        p_slug: slug,
        p_bio: bio,
        p_photo_url: input.photoUrl,
      });
      if (rpcErr) {
        // the check above is check-then-act; a concurrent rename can still win
        // the race and surface as a raw unique violation
        if (rpcErr.code === "23505" || /duplicate key|already taken/i.test(rpcErr.message))
          return { ok: false, error: `The URL /${slug} is already taken.` };
        throw new Error(rpcErr.message);
      }

      if (slug !== person.slug) revalidatePath(`/person/${slug}`);
    } else {
      const { error: pErr } = await supabase
        .from("people")
        .update({ name, bio, photo_url: input.photoUrl })
        .eq("id", input.personId);
      if (pErr) throw new Error(pErr.message);
    }

    revalidatePath(`/person/${person.slug}`);
    revalidatePath("/account");
    revalidatePath("/admin");
    revalidatePath("/explore");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("updatePerson:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Update failed." };
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
