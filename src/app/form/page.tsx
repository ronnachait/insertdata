'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState } from 'react'

export default function Form() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      setStatus("กรุณาล็อกอินก่อนส่งข้อมูล")
      return
    }

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify({ name: 'User', email: 'example@yourdomain.com' }),
        headers: { 'Content-Type': 'application/json' },
      })

      // ตรวจสอบว่า status ของคำตอบเป็น 2xx (สำเร็จ)
      if (!res.ok) {
        const errorMessage = await res.text() // ใช้ .text() แทน .json() เพื่อจับข้อความผิดพลาด
        setStatus(`เกิดข้อผิดพลาด: ${errorMessage}`)
        return
      }

      const data = await res.json()
      setStatus("การส่งข้อมูลสำเร็จ!")
      console.log(data)

    } catch (error) {
      // ถ้ามีข้อผิดพลาดในการส่งคำขอ
      setStatus("เกิดข้อผิดพลาดในการส่งคำขอ")
      console.error(error)
    }
  }

  return (
    <div>
      {status && <h1>{status}</h1>}
      {session ? (
        <button onClick={handleSubmit}>ส่งข้อมูล</button>
      ) : (
        <button onClick={() => signIn('google')}>Login ด้วย Google</button>
      )}
    </div>
  )
}
