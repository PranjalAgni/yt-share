"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Channel {
  channelId: string;
  name: string;
  thumbnail: string;
  navigationEndpoint: string;
}

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function YoutubeDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [listName, setListName] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const isAuthenticated = useProtectedRoute();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const fetchChannels = useCallback(async (query: string) => {
    if (!query) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/fetchChannels?q=${encodeURIComponent(query)}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }
      const data: Channel[] = await response.json();
      setSearchResults(data);
      setIsDropdownOpen(true);
    } catch (err) {
      console.error("Error fetching channels:", err);
      setError("Failed to fetch channels. Please try again.");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels(debouncedSearchQuery);
  }, [debouncedSearchQuery, fetchChannels]);

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannels((prev) => [...prev, channel]);
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleCreateList = () => {
    console.log("Created list:", {
      name: listName,
      channels: selectedChannels,
    });
    // Here you would typically send this data to your backend
    setListName("");
    setSelectedChannels([]);
  };

  const handleRemoveChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.filter((channel) => channel.channelId !== channelId)
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">YouTube Channel Dashboard</h1>

      <div className="mb-4 relative">
        <div className="mb-4 flex gap-2">
          <Input
            type="text"
            placeholder="Enter list name"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
          <Button
            onClick={handleCreateList}
            disabled={!listName || selectedChannels.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" /> Create List
          </Button>
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search YouTube channels"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {isLoading && <p className="mt-2 text-gray-500">Loading...</p>}
        {error && <p className="mt-2 text-red-500">{error}</p>}

        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {searchResults.map((channel) => (
              <div
                key={channel.channelId}
                className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectChannel(channel)}
              >
                <Image
                  src={channel.thumbnail.replace("//", "https://")}
                  alt={channel.name}
                  width={40}
                  height={40}
                  className="rounded-full mr-2"
                />
                <span>{channel.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {selectedChannels.map((channel) => (
          <Card key={channel.channelId} className="relative">
            <CardContent className="p-4">
              <button
                onClick={() => handleRemoveChannel(channel.channelId)}
                className="absolute top-2 right-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                aria-label={`Remove ${channel.name}`}
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
              <div className="flex items-center space-x-4">
                <Image
                  src={channel.thumbnail.replace("//", "https://")}
                  alt={channel.name}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{channel.name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
