'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, Copy, Check, UploadCloud, Smartphone } from 'lucide-react'
import { MarketplaceListing } from '../types'
import { MarketplaceTheme } from '../theme'
import { createClient } from '@/app/lib/supabase/client'

interface Props {
  listing: MarketplaceListing | null
  currentUserId?: string
  onClose: () => void
  onSuccess: () => void
}

export function DisclaimerConsentModal({ listing, currentUserId, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'disclaimer' | 'phone' | 'payment' | 'success'>('disclaimer')
  const [agreed, setAgreed] = useState(false)
  const [phone, setPhone] = useState('')
  const [utrNumber, setUtrNumber] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Payment settings state
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [upiId, setUpiId] = useState<string>('istesctce@oksbi')

  useEffect(() => {
    async function loadSettingsAndProfile() {
      const supabase = createClient()
      try {
        const { data: settings } = await supabase
          .from('payment_settings')
          .select('qr_image_url, upi_id')
          .limit(1)
          .maybeSingle()

        if (settings) {
          if (settings.qr_image_url) setQrUrl(settings.qr_image_url)
          if (settings.upi_id) setUpiId(settings.upi_id)
        }

        if (currentUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', currentUserId)
            .maybeSingle()
          if (profile?.phone) {
            setPhone(profile.phone)
          }
        }
      } catch (err) {
        console.error('Error fetching payment settings:', err)
      }
    }
    loadSettingsAndProfile()
  }, [currentUserId])

  if (!listing) return null

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPhone = phone.trim()
    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit phone number.')
      return
    }
    setErrorMsg(null)
    setStep('payment')
  }

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProofFile(file)
      setProofPreview(URL.createObjectURL(file))
      setErrorMsg(null)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!proofFile) {
      setErrorMsg('Please upload your payment screenshot.')
      return
    }
    const cleanUtr = utrNumber.trim()
    if (!/^\d{12}$/.test(cleanUtr)) {
      setErrorMsg('Please enter a valid 12-digit UPI Transaction ID / UTR.')
      return
    }

    if (!currentUserId) {
      setErrorMsg('Please log in to complete your purchase.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const supabase = createClient()

      // 1. Upload proof screenshot to storage
      const ext = proofFile.name.split('.').pop() || 'png'
      const filePath = `${currentUserId}/${listing.id}_${Date.now()}.${ext}`

      // Try uploading to marketplace-payment-proofs or fallback bucket
      let uploadRes = await supabase.storage
        .from('marketplace-payment-proofs')
        .upload(filePath, proofFile, { upsert: true })

      let finalProofPath = filePath

      if (uploadRes.error) {
        // Fallback to marketplace_bucket if specific bucket differs
        const fallbackRes = await supabase.storage
          .from('marketplace_bucket')
          .upload(`proofs/${filePath}`, proofFile, { upsert: true })

        if (fallbackRes.error) {
          throw new Error(uploadRes.error.message || fallbackRes.error.message)
        }
        finalProofPath = `proofs/${filePath}`
      }

      // 2. Insert into marketplace_orders
      const { error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          listing_id: listing.id,
          buyer_id: currentUserId,
          amount: listing.price,
          payment_proof_url: finalProofPath,
          utr_number: cleanUtr,
          phone_number: phone.trim(),
          disclaimer_accepted_at: new Date().toISOString(),
          order_status: 'pending_verification',
        })

      if (orderError) throw orderError

      // 3. Update profile phone if not set
      await supabase.from('profiles').update({ phone: phone.trim() }).eq('id', currentUserId)

      setStep('success')
    } catch (err: any) {
      console.error('Payment submission failed:', err)
      setErrorMsg(err.message || 'Payment submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#DDDAF0]" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-[#2C2A45] flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto flex-1 p-6 sm:p-7 space-y-5 custom-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
              {errorMsg}
            </div>
          )}

          {/* ── PHASE 1: DISCLAIMER ── */}
          {step === 'disclaimer' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-[#2C2A45]">Payment Notice</h3>
                <p className="text-xs text-[#8D8AA0] mt-0.5">
                  Item: {listing.title} (₹{Math.round(listing.price).toLocaleString('en-IN')})
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#EDEAFF] border border-[#7B6EF6]/20 text-[#2C2A45] text-xs sm:text-sm leading-relaxed font-medium space-y-2.5">
                <p>
                  The payment you make goes directly into ISTE's account. ISTE will then release the
                  payment to the seller, and the product will be issued to you by ISTE.
                </p>
                <p>
                  If the item is not received within 24 hours of confirmed payment, ISTE will
                  process a full refund. By proceeding, you agree to these terms.
                </p>
              </div>

              {/* Checkbox agreement */}
              <label className="flex items-start gap-3 cursor-pointer pt-2 select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-[#8D8AA0] text-[#7B6EF6] focus:ring-[#7B6EF6] cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-semibold text-[#2C2A45] leading-snug">
                  I have read and agree to the terms above
                </span>
              </label>

              <button
                type="button"
                disabled={!agreed}
                onClick={() => setStep('phone')}
                className="w-full h-12 rounded-full font-black text-white text-sm shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center mt-4"
                style={{
                  background: agreed ? MarketplaceTheme.heroGradient : '#E5E3F0',
                  color: agreed ? 'white' : '#8D8AA0',
                }}
              >
                I Agree — Show Payment Details
              </button>
            </div>
          )}

          {/* ── PHASE 2: PHONE VERIFICATION ── */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-[#2C2A45]">Contact Information</h3>
                <p className="text-xs text-[#8D8AA0] mt-1 leading-relaxed">
                  Please confirm your phone number. Sellers or EXECOM will use this to coordinate the
                  product handoff.
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#8D8AA0]">
                  Mobile Number (10 Digits)
                </label>
                <div className="relative flex items-center bg-[#F6F4FC] rounded-2xl border border-black/10 focus-within:border-[#7B6EF6] focus-within:ring-2 focus-within:ring-[#7B6EF6]/20">
                  <Smartphone size={18} className="absolute left-3.5 text-[#8D8AA0]" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 9876543210"
                    className="w-full h-12 pl-11 pr-4 bg-transparent text-sm font-bold text-[#2C2A45] focus:outline-none placeholder-[#8D8AA0]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-full font-black text-white text-sm shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center mt-4"
                style={{ background: MarketplaceTheme.heroGradient }}
              >
                Confirm & Proceed to Payment
              </button>
            </form>
          )}

          {/* ── PHASE 3: PAYMENT DETAILS ── */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-[#2C2A45]">Complete Payment</h3>
                <p className="text-xs text-[#8D8AA0] mt-0.5">
                  Pay ₹{Math.round(listing.price).toLocaleString('en-IN')} to the ISTE SCTCE account
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#F6F4FC] border border-black/[0.06]">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Payment QR Code"
                    className="w-44 h-44 object-contain rounded-xl shadow-sm bg-white p-2"
                  />
                ) : (
                  <div className="w-44 h-44 rounded-xl bg-white flex flex-col items-center justify-center p-3 text-center border border-black/5">
                    <span className="text-4xl mb-1">📱</span>
                    <p className="text-[11px] font-bold text-[#2C2A45]">ISTE SCTCE UPI</p>
                    <p className="text-[10px] text-[#8D8AA0] mt-1">Scan or use the UPI ID below</p>
                  </div>
                )}
              </div>

              {/* UPI ID with Copy Button */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#EDEAFF] border border-[#7B6EF6]/20">
                <div className="min-w-0 pr-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#7B6EF6]">
                    UPI ID
                  </p>
                  <p className="text-sm font-bold text-[#2C2A45] truncate">{upiId}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white text-[#7B6EF6] text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                >
                  {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Upload Screenshot */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#8D8AA0]">
                  Upload Payment Screenshot
                </label>
                <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#7B6EF6]/40 rounded-2xl hover:bg-[#F6F4FC] cursor-pointer transition-colors text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofChange}
                    className="hidden"
                  />
                  {proofPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={proofPreview}
                        alt="Proof preview"
                        className="w-12 h-12 object-cover rounded-lg shadow"
                      />
                      <span className="text-xs font-bold text-[#2C2A45] truncate max-w-[180px]">
                        {proofFile?.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud size={24} className="text-[#7B6EF6]" />
                      <span className="text-xs font-bold text-[#7B6EF6]">
                        Tap to upload screenshot
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* 12-Digit UTR Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#8D8AA0]">
                  UPI Transaction ID / UTR (12 Digits)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 423456789012"
                  className="w-full h-11 px-4 rounded-xl bg-[#F6F4FC] border border-black/10 text-sm font-bold text-[#2C2A45] focus:outline-none focus:border-[#7B6EF6]"
                />
                <p className="text-[10px] text-[#8D8AA0] leading-tight">
                  Enter the 12-digit transaction/UTR number from GPay / PhonePe / Paytm.
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePaymentSubmit}
                className="w-full h-12 rounded-full font-black text-white text-sm shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center mt-2 disabled:opacity-50"
                style={{ background: MarketplaceTheme.heroGradient }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Payment Proof'}
              </button>
            </div>
          )}

          {/* ── SUCCESS STATE ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md">
                <CheckCircle size={36} />
              </div>

              <div>
                <h3 className="text-xl font-black text-[#2C2A45]">Submitted for Review</h3>
                <p className="text-xs sm:text-sm text-[#8D8AA0] mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Your payment details have been successfully submitted! The EXECOM team will verify
                  it shortly. 🎉
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSuccess()
                  onClose()
                }}
                className="w-full h-12 rounded-full font-black text-white text-sm shadow-md transition-all mt-4 cursor-pointer"
                style={{ background: MarketplaceTheme.heroGradient }}
              >
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
