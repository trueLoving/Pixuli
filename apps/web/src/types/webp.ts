export interface WebPCompressOptions {
  quality: number
  lossless?: boolean
  method?: number
}

export interface WebPCompressResult {
  data: number[]
  originalSize: number
  compressedSize: number
  compressionRatio: number
  fileName: string
}
