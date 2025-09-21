import { z } from 'zod'
import { scrappingBeeAdapter } from '@/infra/adapters/scrapping-bee'

export const insertBookmarkSchema = z.object({
  workspaceId: z.string(),
  memberId: z.string(),
  url: z.string(),
})

export type InsertBookmarkInput = z.infer<typeof insertBookmarkSchema>

export async function createBookmark(bookmark: InsertBookmarkInput) {
  // move to controller later
  // const membership = await getMembership(
  //   bookmark.workspaceId,
  //   bookmark.memberId
  // )

  // if (membership instanceof DomainError) {
  //   return membership
  // }createBookmark

  const response = await scrappingBeeAdapter(bookmark.url)
    .then(response => {
      const decoder = new TextDecoder()
      const text = decoder.decode(response.data)

      return text
    })
    .catch(e => console.log(`A problem occurred : ${e.response.data}`))

  return response
}
