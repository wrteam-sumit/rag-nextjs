"use client";

import { BiBulb, BiRocket, BiFile, BiSearch } from "react-icons/bi";

interface WelcomeMessageProps {
  chatMode: string;
}

export default function WelcomeMessage({ chatMode }: WelcomeMessageProps) {
  const getWelcomeText = () => {
    switch (chatMode) {
      case "web":
        return "I'm your web assistant. I can search the internet and provide you with the latest information on any topic. What would you like to know?";
      case "hybrid":
        return "I'm your hybrid assistant. I can answer questions from your uploaded documents and also search the web for additional information. What can I help you with?";
      default:
        return "I'm your document assistant. I can answer questions based on the documents you've uploaded. What would you like to know about your documents?";
    }
  };

  const getModeDescription = () => {
    switch (chatMode) {
      case "web":
        return "Web Search Mode";
      case "hybrid":
        return "Hybrid Mode";
      default:
        return "Document Mode";
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 min-w-0">
      <div className="max-w-2xl w-full text-center min-w-0">
        {/* AI Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <BiBulb className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Welcome Text */}
        <h1 className="text-4xl font-bold text-gray-100 mb-4">
          Ready when you are.
        </h1>

        <p className="text-lg text-gray-300 mb-6 leading-relaxed">
          {getWelcomeText()}
        </p>

        {/* Mode Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-sm text-gray-300 mb-8">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          {getModeDescription()}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4 text-left min-w-0">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <BiRocket className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-100">Fast & Accurate</h3>
            </div>
            <p className="text-sm text-gray-400">
              Get instant, accurate responses powered by advanced AI models.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <BiFile className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-100">Document Analysis</h3>
            </div>
            <p className="text-sm text-gray-400">
              Upload documents and get intelligent insights from your content.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <BiSearch className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-100">Web Search</h3>
            </div>
            <p className="text-sm text-gray-400">
              Access real-time information from the web when needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
