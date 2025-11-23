"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FAQPage() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	const faqs = [
		{
			question: "What is an NDA?",
			answer: "A Non-Disclosure Agreement (NDA) is a legally binding contract that establishes a confidential relationship between parties. It's used to protect sensitive information from being shared with third parties."
		},
		{
			question: "How do I create an NDA?",
			answer: "Simply sign up for an account, choose a template from our library, fill in the required information, and customize it to your needs. You can then send it for signature or download it as a PDF."
		},
		{
			question: "Are the NDAs legally binding?",
			answer: "Yes, our templates are created based on standard legal frameworks. However, we recommend consulting with a legal professional for specific situations or jurisdictions."
		},
		{
			question: "Can I customize the templates?",
			answer: "Absolutely! All our templates are fully customizable. You can modify clauses, add specific terms, and adjust the document to fit your exact requirements."
		},
		{
			question: "How do I send an NDA for signature?",
			answer: "After creating your NDA, click the 'Send' button, enter the recipient's email address, and we'll send them a secure link to review and sign the document electronically."
		},
		{
			question: "What's the difference between unilateral and mutual NDAs?",
			answer: "A unilateral NDA protects information shared by one party, while a mutual NDA protects information shared by both parties. Choose based on whether one or both parties will be sharing confidential information."
		},
		{
			question: "Can I track the status of my NDAs?",
			answer: "Yes! Your dashboard shows the status of all your NDAs - draft, sent, pending signature, signed, or expired. You'll also receive email notifications when actions are taken."
		},
		{
			question: "How long does an NDA last?",
			answer: "The duration is customizable and specified in the agreement. Common terms range from 1-5 years, but you can set any timeframe that suits your needs."
		},
		{
			question: "Is my data secure?",
			answer: "Yes, we use industry-standard encryption and security measures to protect your data. All documents are stored securely and transmitted over encrypted connections."
		},
		{
			question: "Can I cancel my subscription anytime?",
			answer: "Yes, you can cancel your subscription at any time. You'll retain access to your account until the end of your current billing period."
		}
	];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Hero Section */}
			<div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<HelpCircle className="w-16 h-16 mx-auto mb-6 text-teal-400" />
					<h1 className="text-4xl md:text-5xl font-bold mb-6">
						Frequently Asked Questions
					</h1>
					<p className="text-xl text-gray-300">
						Find answers to common questions about our NDA platform
					</p>
				</div>
			</div>

			{/* FAQ Section */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="space-y-4">
					{faqs.map((faq, index) => (
						<div
							key={index}
							className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
						>
							<button
								onClick={() => setOpenIndex(openIndex === index ? null : index)}
								className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
							>
								<span className="font-semibold text-gray-900 pr-8">
									{faq.question}
								</span>
								<ChevronDown
									className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
										openIndex === index ? "transform rotate-180" : ""
									}`}
								/>
							</button>
							{openIndex === index && (
								<div className="px-6 pb-4 text-gray-600">
									{faq.answer}
								</div>
							)}
						</div>
					))}
				</div>

				{/* Contact Section */}
				<div className="mt-16 text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Still have questions?
					</h2>
					<p className="text-gray-600 mb-6">
						Can't find the answer you're looking for? Our support team is here to help.
					</p>
					<a
						href="/contact"
						className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
					>
						Contact Support
					</a>
				</div>
			</div>
		</div>
	);
}
