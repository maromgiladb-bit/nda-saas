export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 mb-6">
            Have questions about our NDA management platform? We&apos;re here to help!
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Email</h3>
              <p className="text-gray-600">support@ndasaas.com</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Phone</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Business Hours</h3>
              <p className="text-gray-600">Monday - Friday, 9:00 AM - 6:00 PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
