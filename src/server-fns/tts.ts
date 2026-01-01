import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getTTSClient } from './google-clients'

export const textToSpeechFn = createServerFn()
  .inputValidator(
    z.object({
      text: z.string(),
      languageCode: z.string().default('en-US'),
      speakingRate: z.number().min(0.25).max(4.0).default(1.0),
    })
  )
  .handler(async ({ data }) => {
    const request = {
      input: { text: data.text },
      voice: { languageCode: data.languageCode, ssmlGender: 'NEUTRAL' as const },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: data.speakingRate,
      },
    }

    const [response] = await getTTSClient().synthesizeSpeech(request)

    if (!response.audioContent) {
      throw new Error('No audio content returned from Google TTS')
    }

    const base64Audio = Buffer.from(response.audioContent as Uint8Array).toString('base64')
    return { audioContent: base64Audio }
  })
