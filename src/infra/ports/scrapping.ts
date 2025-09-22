export type ScrappingService = {
  scrapping(url: string): Promise<string>
}
