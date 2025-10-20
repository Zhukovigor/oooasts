"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function createArticle(formData: FormData) {
  try {
    const supabase = createAdminClient()

    const tags = formData.get("tags") as string
    const tagsArray = tags ? tags.split(",").map((tag) => tag.trim()) : []

    const articleData = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      excerpt: formData.get("excerpt") as string,
      content: formData.get("content") as string,
      main_image: formData.get("main_image") as string,
      author: formData.get("author") as string,
      category: formData.get("category") as string,
      tags: tagsArray,
      status: formData.get("status") as string,
      featured: formData.get("featured") === "true",
      meta_title: formData.get("meta_title") as string,
      meta_description: formData.get("meta_description") as string,
      published_at: formData.get("status") === "published" ? new Date().toISOString() : null,
    }

    const { data, error } = await supabase.from("articles").insert([articleData]).select().single()

    if (error) {
      console.error("Error creating article:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/stati")
    revalidatePath("/admin/stati")

    return { success: true, data }
  } catch (error) {
    console.error("Error in createArticle:", error)
    return { success: false, error: "Произошла ошибка при создании статьи" }
  }
}

export async function updateArticle(id: string, formData: FormData) {
  try {
    const supabase = createAdminClient()

    const tags = formData.get("tags") as string
    const tagsArray = tags ? tags.split(",").map((tag) => tag.trim()) : []

    const articleData = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      excerpt: formData.get("excerpt") as string,
      content: formData.get("content") as string,
      main_image: formData.get("main_image") as string,
      author: formData.get("author") as string,
      category: formData.get("category") as string,
      tags: tagsArray,
      status: formData.get("status") as string,
      featured: formData.get("featured") === "true",
      meta_title: formData.get("meta_title") as string,
      meta_description: formData.get("meta_description") as string,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("articles").update(articleData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating article:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/stati")
    revalidatePath(`/stati/${data.slug}`)
    revalidatePath("/admin/stati")

    return { success: true, data }
  } catch (error) {
    console.error("Error in updateArticle:", error)
    return { success: false, error: "Произошла ошибка при обновлении статьи" }
  }
}

export async function deleteArticle(id: string) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from("articles").delete().eq("id", id)

    if (error) {
      console.error("Error deleting article:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/stati")
    revalidatePath("/admin/stati")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteArticle:", error)
    return { success: false, error: "Произошла ошибка при удалении статьи" }
  }
}
