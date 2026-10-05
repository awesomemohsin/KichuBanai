export interface UploadResult {
  url: string
  pathname: string
  sizeBytes: number
  contentType: string
}

export interface StorageProvider {
  upload(file: Blob | Buffer, filename: string, contentType: string): Promise<UploadResult>
  delete(urlOrPath: string): Promise<boolean>
  getPublicUrl(pathname: string): string
}

/**
 * Local/DataURI storage provider for autonomous, zero-cost development and testing.
 * Implements the StorageProvider interface cleanly so it can be swapped for Vercel Blob, S3, etc.
 */
export class LocalStorageProvider implements StorageProvider {
  async upload(file: Blob | Buffer, filename: string, contentType: string): Promise<UploadResult> {
    let size = 0
    let url = ''

    if (Buffer.isBuffer(file)) {
      size = file.length
      const base64 = file.toString('base64')
      url = `data:${contentType};base64,${base64}`
    } else {
      size = file.size
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      url = `data:${contentType};base64,${base64}`
    }

    return {
      url,
      pathname: `/uploads/${filename}`,
      sizeBytes: size,
      contentType,
    }
  }

  async delete(_urlOrPath: string): Promise<boolean> {
    return true
  }

  getPublicUrl(pathname: string): string {
    return pathname
  }
}

let activeStorageProvider: StorageProvider = new LocalStorageProvider()

export function getStorageProvider(): StorageProvider {
  return activeStorageProvider
}

export function setStorageProvider(provider: StorageProvider) {
  activeStorageProvider = provider
}
