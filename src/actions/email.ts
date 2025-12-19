'use server'

import { Resend } from 'resend'
import { getSiteUrl } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteEmail(email: string, storeName: string) {
  const baseUrl = getSiteUrl()
  try {
    const { data, error } = await resend.emails.send({
      from: 'POS System <onboarding@resend.dev>', // Default testing domain
      to: email,
      subject: `Undangan Bergabung ke ${storeName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Undangan Staff</h1>
          <p>Halo,</p>
          <p>Anda telah diundang untuk bergabung dengan toko <strong>${storeName}</strong> sebagai Staff.</p>
          <p>Silakan daftarkan akun Anda menggunakan email ini (<strong>${email}</strong>) untuk mendapatkan akses otomatis.</p>
          <br/>
          <a href="${baseUrl}/" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Daftar Sekarang
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Jika tombol di atas tidak berfungsi, copy link ini: ${baseUrl}/
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Server Action Error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
