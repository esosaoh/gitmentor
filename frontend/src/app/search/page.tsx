"use client";

import { useState, useCallback } from "react";
import InputForm from "../components/InputForm";
import SummaryWindow from "../components/SummaryWindow";
import Notification from "../components/Notification";
import Banner from "../components/Banner";

export default function Search() {
  const [url, setUrl] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Add loading state

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setLoading(true); // Start loading
    const trimmedUrl = url.trim();
    const trimmedQuery = query.trim();

    if (!trimmedUrl || !trimmedQuery) {
      setNotificationMessage("Please fill in both the URL and query fields.");
      setShowNotification(true);
      setLoading(false); // Stop loading
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setNotificationMessage("Please enter a valid URL.");
      setShowNotification(true);
      setLoading(false); // Stop loading
      return;
    }

    try {
      const response = await fetch("https://api.gitmentor.co/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: trimmedUrl, feature_description: trimmedQuery }),
      });

      if (!response.ok) {
        console.error(response.status);
        setNotificationMessage("Failed to receive data.");
        setShowNotification(true);
        setLoading(false); // Stop loading
        return;
      }

      const data = await response.json();

      let final = `# ${data.repository_name}\n\n`;

      final += `## Feature Summary\n${data.feature_summary}\n\n`;

      final += "## Implementation Steps\n";
      for (const step of data.implementation_steps) {
        final += `${step.step_number}. ${step.description}\n`;
        if (step.code_snippet) {
          final += "```" + "ts\n" + step.code_snippet + "\n```\n";
        }
        if (step.file_path) {
          final += `File: \`${step.file_path}\`\n`;
        }
        final += "\n";
      }

      final += "## Setup Instructions\n";
      for (const instruction of data.setup_instructions) {
        final += `${instruction.step_number}. ${instruction.description}\n`;
        if (instruction.code) {
          final += "```" + "sh\n" + instruction.code + "\n```\n";
        }
        final += "\n";
      }

      final += "## Potential Challenges\n";
      for (const challenge of data.potential_challenges) {
        final += `- ${challenge}\n`;
      }
      final += "\n";

      final += "## Relevant Files\n";
      for (const file of data.relevant_files) {
        final += `- **Path:** \`${file.path}\`\n`;
        final += `  - **Importance:** ${file.importance}\n`;
        final += `  - **Reason:** ${file.reason}\n`;
        if (file.content_preview) {
          final += `  - **Content Preview:**\n\n\`\`\`\n${file.content_preview}\n\`\`\`\n`;
        }
        final += "\n";
      }

      setShowNotification(false);
      setSummaryContent(final);
      setShowSummary(true);
    } catch (error) {
      console.error("Error:", error);
      setNotificationMessage("Failed to connect to the server.");
      setShowNotification(true);
    } finally {
      setLoading(false); // Stop loading (whether success or error)
    }
  }, [url, query]);

  // Reset form
  const resetForm = useCallback(() => {
    setQuery("");
    setShowSummary(false);
    setShowNotification(false);
    setNotificationMessage("");
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-4">
      {/* Banner */}
      <Banner />

      {/* Input Form */}
      {!showSummary && (
        <InputForm
          url={url}
          setUrl={setUrl}
          query={query}
          setQuery={setQuery}
          onSubmit={handleSubmit}
          loading={loading} // Pass loading state to InputForm
        />
      )}

      {/* Summary Window */}
      {showSummary && <SummaryWindow onReset={resetForm} content={summaryContent} />}

      {/* Notification */}
      {showNotification && (
        <Notification
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
}