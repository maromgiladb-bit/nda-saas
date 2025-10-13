export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About NDA SaaS</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-6">
            Streamline your NDA creation and management process with our powerful platform.
          </p>
          <p className="text-gray-700 mb-4">
            Our NDA SaaS platform helps businesses create, customize, and manage 
            non-disclosure agreements efficiently. With automated workflows, 
            digital signatures, and comprehensive tracking, you can protect your 
            confidential information while saving time and resources.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Key Features</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Customizable NDA templates</li>
            <li>Digital signature integration</li>
            <li>Real-time status tracking</li>
            <li>Secure document storage</li>
            <li>Automated reminders</li>
            <li>Compliance management</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
