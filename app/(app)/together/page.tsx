import TogetherClient from './TogetherClient'

export default function TogetherPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="section-title">❤️ Time Together</h1>
        <p className="section-subtitle">Every second with you counts</p>
      </div>
      <TogetherClient />
    </div>
  )
}
