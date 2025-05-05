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

  const sanitizedTop =
    sanitizeForUrl(topText) === '' ? '_' : sanitizeForUrl(topText)
  const sanitizedBottom =
    sanitizeForUrl(bottomText) === '' ? '_' : sanitizeForUrl(bottomText)

  // Generate the URL - a double slash can occur if sanitizedTop or sanitizedBottom is empty
  const url = `${MEMEGEN_API_BASE}/images/${templateId}/${sanitizedTop}/${sanitizedBottom}.${format}`

  // Fix any double slashes in the path (but preserve protocol's double slash)
  const [protocol, rest] = url.split('://')
  const fixedRest = rest.replace(/\/\//g, '/_/')
  return `${protocol}://${fixedRest}`
}
