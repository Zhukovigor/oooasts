"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function createEquipment(formData: FormData) {
  try {
    const supabase = createAdminClient()

    const images = formData.get("images") as string
    const imagesArray = images ? images.split(",").map((img) => img.trim()) : []

    const specifications = formData.get("specifications") as string
    let specificationsObj = {}
    try {
      specificationsObj = specifications ? JSON.parse(specifications) : {}
    } catch (e) {
      console.error("Error parsing specifications:", e)
    }

    const equipmentData = {
      category_id: formData.get("category_id") as string,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      model_code: formData.get("model_code") as string,
      description: formData.get("description") as string,
      main_image: formData.get("main_image") as string,
      images: imagesArray,
      working_weight: formData.get("working_weight") ? Number.parseInt(formData.get("working_weight") as string) : null,
      bucket_volume: formData.get("bucket_volume") ? Number.parseFloat(formData.get("bucket_volume") as string) : null,
      max_digging_depth: formData.get("max_digging_depth")
        ? Number.parseInt(formData.get("max_digging_depth") as string)
        : null,
      max_reach: formData.get("max_reach") ? Number.parseInt(formData.get("max_reach") as string) : null,
      engine_manufacturer: formData.get("engine_manufacturer") as string,
      engine_power: formData.get("engine_power") ? Number.parseInt(formData.get("engine_power") as string) : null,
      engine_model: formData.get("engine_model") as string,
      specifications: specificationsObj,
      price_on_request: formData.get("price_on_request") === "true",
      price: formData.get("price") ? Number.parseFloat(formData.get("price") as string) : null,
      currency: formData.get("currency") as string,
      is_featured: formData.get("is_featured") === "true",
      is_active: formData.get("is_active") === "true",
    }

    const { data, error } = await supabase.from("catalog_models").insert([equipmentData]).select().single()

    if (error) {
      console.error("Error creating equipment:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/katalog")
    revalidatePath("/admin/equipment")

    return { success: true, data }
  } catch (error) {
    console.error("Error in createEquipment:", error)
    return { success: false, error: "Произошла ошибка при создании техники" }
  }
}

export async function updateEquipment(id: string, formData: FormData) {
  try {
    const supabase = createAdminClient()

    const images = formData.get("images") as string
    const imagesArray = images ? images.split(",").map((img) => img.trim()) : []

    const specifications = formData.get("specifications") as string
    let specificationsObj = {}
    try {
      specificationsObj = specifications ? JSON.parse(specifications) : {}
    } catch (e) {
      console.error("Error parsing specifications:", e)
    }

    const equipmentData = {
      category_id: formData.get("category_id") as string,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      model_code: formData.get("model_code") as string,
      description: formData.get("description") as string,
      main_image: formData.get("main_image") as string,
      images: imagesArray,
      working_weight: formData.get("working_weight") ? Number.parseInt(formData.get("working_weight") as string) : null,
      bucket_volume: formData.get("bucket_volume") ? Number.parseFloat(formData.get("bucket_volume") as string) : null,
      max_digging_depth: formData.get("max_digging_depth")
        ? Number.parseInt(formData.get("max_digging_depth") as string)
        : null,
      max_reach: formData.get("max_reach") ? Number.parseInt(formData.get("max_reach") as string) : null,
      engine_manufacturer: formData.get("engine_manufacturer") as string,
      engine_power: formData.get("engine_power") ? Number.parseInt(formData.get("engine_power") as string) : null,
      engine_model: formData.get("engine_model") as string,
      specifications: specificationsObj,
      price_on_request: formData.get("price_on_request") === "true",
      price: formData.get("price") ? Number.parseFloat(formData.get("price") as string) : null,
      currency: formData.get("currency") as string,
      is_featured: formData.get("is_featured") === "true",
      is_active: formData.get("is_active") === "true",
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("catalog_models").update(equipmentData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating equipment:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/katalog")
    revalidatePath("/admin/equipment")

    return { success: true, data }
  } catch (error) {
    console.error("Error in updateEquipment:", error)
    return { success: false, error: "Произошла ошибка при обновлении техники" }
  }
}

export async function deleteEquipment(id: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from("catalog_models").delete().eq("id", id)

    if (error) {
      console.error("Error deleting equipment:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/katalog")
    revalidatePath("/admin/equipment")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteEquipment:", error)
    return { success: false, error: "Произошла ошибка при удалении техники" }
  }
}
