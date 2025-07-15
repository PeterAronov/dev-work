// portal/src/app/page.tsx
"use client";

import { useState } from "react";

interface SearchResult {
  id: string;
  name: string;
  email?: string;
  location?: string;
  role?: string;
  skills: string[];
  experience?: string;
  interests: string[];
  previousCompanies: string[];
  description: string;
  matchScore: number;
  matchReason: string;
}

interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  totalFound: number;
  finalAnswer: string;
  processingTime: number;
}

interface SyncResponse {
  success: boolean;
  message: string;
  results: {
    plainText: number;
    json: number;
    csv: number;
    total: number;
  };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataSynced, setIsDataSynced] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalFound, setTotalFound] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);

  const syncUsers = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
      });

      const data: SyncResponse = await response.json();

      if (data.success) {
        setIsDataSynced(true);
        alert(
          `Successfully synced ${data.results.total} users!\n` +
            `Plain Text: ${data.results.plainText}\n` +
            `JSON: ${data.results.json}\n` +
            `CSV: ${data.results.csv}`
        );
      } else {
        alert("Failed to sync users");
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Error syncing users");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data: SearchResponse = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        setTotalFound(data.totalFound);
        setProcessingTime(data.processingTime);
      } else {
        alert("Search failed");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error searching users");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-purple-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    const index = name ? name.length % colors.length : 0;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Find Anyone, Instantly</h1>
              <p className="text-gray-600 mt-1">
                Ask questions in plain English. Our AI understands what you're looking for.
              </p>
            </div>
            <div className="text-sm text-gray-500">{isDataSynced ? "✅ Data synced" : "⚠️ Data not synced"}</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Sync Section */}
        {!isDataSynced && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">First, sync your user data</h2>
            <p className="text-blue-700 mb-4">
              Load user profiles from text files, JSON, and CSV sources into the search engine.
            </p>
            <button
              onClick={syncUsers}
              disabled={isSyncing}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? "Syncing Users..." : "Sync Users"}
            </button>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Find software engineers in California, Users with machine learning experience"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                disabled={!isDataSynced}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !isDataSynced || !query.trim()}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>

          {/* Example queries */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Find software engineers in California",
                "Users with machine learning experience",
                "People interested in AI and data science",
                "Backend developers with Python skills",
                "Users living in Europe",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700"
                  disabled={!isDataSynced}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Found {totalFound} users for "{searchQuery}"
              </h2>
              <div className="text-sm text-gray-500">{processingTime}ms</div>
            </div>

            <div className="space-y-4">
              {searchResults.map((user, index) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full ${getAvatarColor(
                        user.name
                      )} flex items-center justify-center text-white font-semibold text-lg`}
                    >
                      {getInitial(user.name)}
                    </div>

                    <div className="flex-1">
                      {/* User Info */}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                          ⭐ {user.matchScore}% match
                        </span>
                      </div>

                      {/* Contact & Location */}
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        {user.email && (
                          <div className="flex items-center">
                            <span className="w-4 text-gray-400">✉</span>
                            <span className="ml-2">{user.email}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center">
                            <span className="w-4 text-gray-400">📍</span>
                            <span className="ml-2">{user.location}</span>
                          </div>
                        )}
                        {user.role && (
                          <div className="flex items-center">
                            <span className="w-4 text-gray-400">💼</span>
                            <span className="ml-2">{user.role}</span>
                          </div>
                        )}
                      </div>

                      {/* Match Reason */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Why this matches:</span> {user.matchReason}
                        </p>
                      </div>

                      {/* Skills */}
                      {user.skills.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-2">
                            {user.skills.map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {user.description && (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {user.description.length > 200
                            ? `${user.description.substring(0, 200)}...`
                            : user.description}
                        </p>
                      )}

                      {/* Additional Info */}
                      {(user.experience || user.previousCompanies.length > 0) && (
                        <div className="mt-3 text-xs text-gray-500 space-y-1">
                          {user.experience && <div>Experience: {user.experience}</div>}
                          {user.previousCompanies.length > 0 && (
                            <div>Previous: {user.previousCompanies.join(", ")}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try a different search query or check if data is synced.</p>
          </div>
        )}
      </div>
    </div>
  );
}
