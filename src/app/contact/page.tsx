"use client";
import React from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[var(--navy-900)] text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slideUp">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: "0.1s" }}>
            Have questions about our NDA platform? We're here to help you streamline your legal agreements.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Email Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover-lift border border-gray-100 animate-slideUp" style={{ animationDelay: "0.2s" }}>
              <div className="w-12 h-12 bg-[var(--teal-50)] rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[var(--teal-600)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--navy-900)] mb-2">Email Us</h3>
              <p className="text-gray-600 mb-2">For general inquiries and support</p>
              <a href="mailto:support@ndasaas.com" className="text-[var(--teal-600)] font-semibold hover:text-[var(--teal-700)] transition-colors">
                support@ndasaas.com
              </a>
            </div>

            {/* Phone Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover-lift border border-gray-100 animate-slideUp" style={{ animationDelay: "0.3s" }}>
              <div className="w-12 h-12 bg-[var(--teal-50)] rounded-xl flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-[var(--teal-600)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--navy-900)] mb-2">Call Us</h3>
              <p className="text-gray-600 mb-2">Mon-Fri from 9am to 6pm EST</p>
              <a href="tel:+15551234567" className="text-[var(--teal-600)] font-semibold hover:text-[var(--teal-700)] transition-colors">
                +1 (555) 123-4567
              </a>
            </div>

            {/* Office Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover-lift border border-gray-100 animate-slideUp" style={{ animationDelay: "0.4s" }}>
              <div className="w-12 h-12 bg-[var(--teal-50)] rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-[var(--teal-600)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--navy-900)] mb-2">Visit Us</h3>
              <p className="text-gray-600">
                123 Legal Tech Blvd<br />
                San Francisco, CA 94105
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 animate-slideUp" style={{ animationDelay: "0.5s" }}>
              <h2 className="text-2xl font-bold text-[var(--navy-900)] mb-6">Send us a Message</h2>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--teal-500)] focus:border-[var(--teal-500)] outline-none transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--teal-500)] focus:border-[var(--teal-500)] outline-none transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--teal-500)] focus:border-[var(--teal-500)] outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--teal-500)] focus:border-[var(--teal-500)] outline-none transition-all bg-white">
                    <option value="">Select a topic</option>
                    <option value="support">Technical Support</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--teal-500)] focus:border-[var(--teal-500)] outline-none transition-all resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-3 bg-[var(--teal-600)] text-white font-semibold rounded-lg hover:bg-[var(--teal-700)] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
