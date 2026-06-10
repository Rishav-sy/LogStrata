"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { clusterSchema } from "@/lib/validation/cluster";
import { profileSchema } from "@/lib/validation/profile";
import { savedScenarioSchema, scenarioConfigurationSchema } from "@/lib/validation/scenario";

function parseJson(value: FormDataEntryValue | null) {
  try {
    return JSON.parse(value?.toString() ?? "{}");
  } catch {
    return null;
  }
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser("/console/account");
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    avatarUrl: formData.get("avatarUrl"),
  });
  if (!parsed.success) throw new Error("Invalid profile details.");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    display_name: parsed.data.displayName || null,
    avatar_url: parsed.data.avatarUrl || null,
  }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/console");
}

export async function createScenario(formData: FormData) {
  const user = await requireUser(formData.get("returnTo")?.toString() || "/console/scenarios");
  const parsed = savedScenarioSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    configuration: parseJson(formData.get("configuration")),
  });
  if (!parsed.success) throw new Error("Invalid scenario configuration.");

  const supabase = await createClient();
  const { error } = await supabase.from("saved_scenarios").insert({
    user_id: user.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    configuration: parsed.data.configuration,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/console/scenarios");
}

export async function updateScenario(formData: FormData) {
  const user = await requireUser("/console/scenarios");
  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() ?? "";
  if (!id || !name || name.length > 100 || description.length > 500) {
    throw new Error("Invalid scenario details.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("saved_scenarios").update({
    name,
    description: description || null,
  }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/console/scenarios");
}

export async function duplicateScenario(formData: FormData) {
  const user = await requireUser("/console/scenarios");
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Scenario ID is required.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("saved_scenarios").select("*").eq("id", id).eq("user_id", user.id).single();
  if (error || !data) throw new Error("Scenario not found.");
  const configuration = scenarioConfigurationSchema.parse(data.configuration);
  const { error: insertError } = await supabase.from("saved_scenarios").insert({
    user_id: user.id,
    name: `${data.name} copy`.slice(0, 100),
    description: data.description,
    configuration,
  });
  if (insertError) throw new Error(insertError.message);
  revalidatePath("/console/scenarios");
}

export async function deleteScenario(formData: FormData) {
  const user = await requireUser("/console/scenarios");
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Scenario ID is required.");
  const supabase = await createClient();
  const { error } = await supabase.from("saved_scenarios").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/console/scenarios");
}

export async function createCluster(formData: FormData) {
  const user = await requireUser("/console/clusters");
  const parsed = clusterSchema.safeParse({
    name: formData.get("name"),
    provider: formData.get("provider"),
    environment: formData.get("environment"),
    status: "onboarding",
    onboardingStep: 1,
    connectionMetadata: {},
  });
  if (!parsed.success) throw new Error("Invalid cluster details.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("clusters").insert({
    user_id: user.id,
    name: parsed.data.name,
    provider: parsed.data.provider,
    environment: parsed.data.environment,
    status: parsed.data.status,
    onboarding_step: parsed.data.onboardingStep,
    connection_metadata: parsed.data.connectionMetadata,
  }).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/console/clusters/${data.id}`);
}

export async function updateCluster(formData: FormData) {
  const user = await requireUser("/console/clusters");
  const id = formData.get("id")?.toString();
  const parsed = clusterSchema.safeParse({
    name: formData.get("name"),
    provider: formData.get("provider"),
    environment: formData.get("environment"),
    status: formData.get("status"),
    onboardingStep: formData.get("onboardingStep"),
    connectionMetadata: parseJson(formData.get("connectionMetadata")),
  });
  if (!id || !parsed.success) throw new Error("Invalid cluster details.");

  const supabase = await createClient();
  const { error } = await supabase.from("clusters").update({
    name: parsed.data.name,
    provider: parsed.data.provider,
    environment: parsed.data.environment,
    status: parsed.data.status,
    onboarding_step: parsed.data.onboardingStep,
    connection_metadata: parsed.data.connectionMetadata,
  }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/console/clusters/${id}`);
  revalidatePath("/console/clusters");
}

export async function deleteCluster(formData: FormData) {
  const user = await requireUser("/console/clusters");
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Cluster ID is required.");
  const supabase = await createClient();
  const { error } = await supabase.from("clusters").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  redirect("/console/clusters");
}
