export const MEMEGEN_API_BASE = 'https://api.memegen.link'

// Helper function to generate a meme URL
export function generateMemeUrl(
  templateId: string,
  topText: string = '',
  bottomText: string = '',
  format: string = 'png',
) {
  // Sanitize text for URL
  const sanitizeForUrl = (text: string) => {
    return text
      .replace(/ /g, '_')
      .replace(/\?/g, '~q')
      .replace(/&/g, '~a')
      .replace(/%/g, '~p')
      .replace(/#/g, '~h')
      .replace(/\//g, '~s')
      .replace(/\\/g, '~b')
      .replace(/</g, '~l')
      .replace(/>/g, '~g')
  }

  const sanitizedTop = sanitizeForUrl(topText)
  const sanitizedBottom = sanitizeForUrl(bottomText)

  return `${MEMEGEN_API_BASE}/images/${templateId}/${sanitizedTop}/${sanitizedBottom}.${format}`
}
