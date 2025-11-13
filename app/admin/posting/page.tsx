import PostingClient from "./posting-client"

export default async function PostingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Управление постингом</h1>
        <p className="text-gray-600 mt-1">Настройка и управление публикацией контента в Telegram</p>
      </div>
      <PostingClient />
    </div>
  )
}
