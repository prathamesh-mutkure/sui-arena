// Walrus Configuration
const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space'
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space'

export interface UploadResult {
  blobId: string
  url: string
}

export async function uploadToWalrus(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/store`, {
      method: 'PUT',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.newlyCreated) {
      return {
        blobId: result.newlyCreated.blobObject.blobId,
        url: `${WALRUS_AGGREGATOR_URL}/v1/${result.newlyCreated.blobObject.blobId}`,
      }
    } else if (result.alreadyCertified) {
      return {
        blobId: result.alreadyCertified.blobId,
        url: `${WALRUS_AGGREGATOR_URL}/v1/${result.alreadyCertified.blobId}`,
      }
    }

    throw new Error('Unexpected response from Walrus')
  } catch (error) {
    console.error('Walrus upload error:', error)
    throw error
  }
}

// Upload URL as text file to Walrus
export async function uploadUrlToWalrus(url: string): Promise<UploadResult> {
  const blob = new Blob([url], { type: 'text/plain' })
  const file = new File([blob], 'game-url.txt', { type: 'text/plain' })
  return uploadToWalrus(file)
}

export function getWalrusUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR_URL}/v1/${blobId}`
}

export function validateGameFile(file: File, gameType: number): boolean {
  if (gameType === 0) {
    // SWF file
    return (
      file.type === 'application/x-shockwave-flash' ||
      file.name.endsWith('.swf') ||
      file.name.endsWith('.swc')
    )
  }

  return true
}
