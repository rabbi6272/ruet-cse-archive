// Link detection and preview utilities for chat components
"use client";

import { useState } from "react";

// Supported platforms for link previews
export const SUPPORTED_PLATFORMS = {
  YOUTUBE: 'youtube',
  CODEFORCES: 'codeforces',
  ATCODER: 'atcoder',
  LEETCODE: 'leetcode',
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
  GOOGLE: 'google',
  FACEBOOK: 'facebook'
};

// URL patterns for different platforms
export const URL_PATTERNS = {
  [SUPPORTED_PLATFORMS.YOUTUBE]: [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i
  ],
  [SUPPORTED_PLATFORMS.CODEFORCES]: [
    /(?:https?:\/\/)?(?:www\.)?codeforces\.com\/(problemset\/problem|contest|gym)\/[\w\/-]+/i,
    /(?:https?:\/\/)?(?:www\.)?codeforces\.com\/profile\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?codeforces\.com\/blog\/entry\/[\d]+/i
  ],
  [SUPPORTED_PLATFORMS.ATCODER]: [
    /(?:https?:\/\/)?(?:www\.)?atcoder\.jp\/contests\/[\w-]+\/tasks\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?atcoder\.jp\/contests\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?atcoder\.jp\/users\/[\w-]+/i
  ],
  [SUPPORTED_PLATFORMS.LEETCODE]: [
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/problems\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/discuss\/[\w\/-]+/i
  ],
  [SUPPORTED_PLATFORMS.GITHUB]: [
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+(?:\/.*)?/i,
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+(?:\/.*)?/i
  ],
  [SUPPORTED_PLATFORMS.LINKEDIN]: [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/posts\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/[\w:-]+/i
  ],
  [SUPPORTED_PLATFORMS.GOOGLE]: [
    /(?:https?:\/\/)?(?:www\.)?(?:docs|drive|forms|sheets|slides)\.google\.com\/[\w\/\-\?=&]+/i,
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/[\w\/\-\?=&]+/i
  ],
  [SUPPORTED_PLATFORMS.FACEBOOK]: [
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w.-]+(?:\/.*)?/i,
    /(?:https?:\/\/)?(?:www\.)?fb\.com\/[\w.-]+/i,
    /(?:https?:\/\/)?(?:www\.)?m\.facebook\.com\/[\w.-]+/i
  ]
};

// Function to detect and parse links in text
export const detectLinks = (text) => {
  const links = [];
  const foundUrls = new Set(); // To avoid duplicates
  
  // Check each platform's patterns
  Object.entries(URL_PATTERNS).forEach(([platform, patterns]) => {
    patterns.forEach(pattern => {
      // Use global flag to find all matches
      const globalPattern = new RegExp(pattern.source, 'gi');
      let match;
      
      while ((match = globalPattern.exec(text)) !== null) {
        const url = match[0];
        const normalizedUrl = url.toLowerCase();
        
        // Avoid duplicate URLs
        if (!foundUrls.has(normalizedUrl)) {
          foundUrls.add(normalizedUrl);
          
          // Extract video ID for YouTube
          let videoId = null;
          if (platform === SUPPORTED_PLATFORMS.YOUTUBE) {
            videoId = getYouTubeVideoId(url);
          }
          
          const linkInfo = {
            platform,
            url: url,
            fullMatch: match[0],
            videoId: videoId
          };
          
          links.push(linkInfo);
        }
      }
    });
  });
  
  return links;
};

// Function to get YouTube video ID from URL
export const getYouTubeVideoId = (url) => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Function to get platform icon
export const getPlatformIcon = (platform) => {
  const icons = {
    [SUPPORTED_PLATFORMS.YOUTUBE]: '🎥',
    [SUPPORTED_PLATFORMS.CODEFORCES]: '💻',
    [SUPPORTED_PLATFORMS.ATCODER]: '🏆',
    [SUPPORTED_PLATFORMS.LEETCODE]: '🧩',
    [SUPPORTED_PLATFORMS.GITHUB]: '🐙',
    [SUPPORTED_PLATFORMS.LINKEDIN]: '💼',
    [SUPPORTED_PLATFORMS.GOOGLE]: '📄',
    [SUPPORTED_PLATFORMS.FACEBOOK]: '📘'
  };
  return icons[platform] || '🔗';
};

// Function to get platform name
export const getPlatformName = (platform) => {
  const names = {
    [SUPPORTED_PLATFORMS.YOUTUBE]: 'YouTube',
    [SUPPORTED_PLATFORMS.CODEFORCES]: 'Codeforces',
    [SUPPORTED_PLATFORMS.ATCODER]: 'AtCoder',
    [SUPPORTED_PLATFORMS.LEETCODE]: 'LeetCode',
    [SUPPORTED_PLATFORMS.GITHUB]: 'GitHub',
    [SUPPORTED_PLATFORMS.LINKEDIN]: 'LinkedIn',
    [SUPPORTED_PLATFORMS.GOOGLE]: 'Google',
    [SUPPORTED_PLATFORMS.FACEBOOK]: 'Facebook'
  };
  return names[platform] || 'Link';
};

// Extract meaningful information from URL
export const getUrlInfo = (url, platform) => {
  const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '');
  
  switch (platform) {
    case SUPPORTED_PLATFORMS.GITHUB:
      const githubMatch = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
      if (githubMatch) {
        return `${githubMatch[1]}/${githubMatch[2]}`;
      }
      break;
    case SUPPORTED_PLATFORMS.LEETCODE:
      const leetcodeMatch = url.match(/leetcode\.com\/problems\/([\w-]+)/);
      if (leetcodeMatch) {
        return `Problem: ${leetcodeMatch[1].replace(/-/g, ' ')}`;
      }
      break;
    case SUPPORTED_PLATFORMS.CODEFORCES:
      if (url.includes('/problemset/problem/')) {
        const cfMatch = url.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d*)/);
        if (cfMatch) {
          return `Problem ${cfMatch[1]}${cfMatch[2]}`;
        }
      } else if (url.includes('/contest/')) {
        const contestMatch = url.match(/\/contest\/(\d+)/);
        if (contestMatch) {
          return `Contest ${contestMatch[1]}`;
        }
      }
      break;
    case SUPPORTED_PLATFORMS.ATCODER:
      if (url.includes('/contests/')) {
        const atcoderMatch = url.match(/\/contests\/([\w-]+)(?:\/tasks\/([\w-]+))?/);
        if (atcoderMatch) {
          if (atcoderMatch[2]) {
            return `${atcoderMatch[1]} - ${atcoderMatch[2]}`;
          } else {
            return `Contest: ${atcoderMatch[1]}`;
          }
        }
      }
      break;
    case SUPPORTED_PLATFORMS.LINKEDIN:
      if (url.includes('/in/')) {
        const linkedinMatch = url.match(/\/in\/([\w-]+)/);
        if (linkedinMatch) {
          return `Profile: ${linkedinMatch[1]}`;
        }
      } else if (url.includes('/company/')) {
        const companyMatch = url.match(/\/company\/([\w-]+)/);
        if (companyMatch) {
          return `Company: ${companyMatch[1]}`;
        }
      }
      break;
  }
  
  return cleanUrl.length > 50 ? cleanUrl.substring(0, 50) + '...' : cleanUrl;
};

// Component for rendering YouTube video embed
export const YouTubeEmbed = ({ videoId, isOwnMessage }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className="mt-2 mb-2">
        <div className={`border rounded-lg p-3 ${
          isOwnMessage 
            ? 'border-indigo-300 bg-indigo-700/30' 
            : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎥</span>
            <span className={`text-sm font-medium ${
              isOwnMessage 
                ? 'text-indigo-100' 
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              YouTube Video (Error loading)
            </span>
          </div>
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm hover:underline ${
              isOwnMessage 
                ? 'text-indigo-200' 
                : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 mb-2">
      <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <i className="fas fa-spinner fa-spin text-gray-500 text-lg"></i>
              <span className="text-xs sm:text-sm text-gray-500">Loading video...</span>
            </div>
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <a 
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs hover:underline inline-flex items-center gap-1 ${
            isOwnMessage 
              ? 'text-indigo-200 hover:text-indigo-100' 
              : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
          }`}
        >
          <span className="hidden xs:inline">Watch on YouTube</span>
          <span className="xs:hidden">YouTube</span>
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
          </svg>
        </a>
        <span className={`text-xs ${
          isOwnMessage 
            ? 'text-indigo-200' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          🎥 YouTube Video
        </span>
      </div>
    </div>
  );
};

// Component for rendering link preview
export const LinkPreview = ({ link, isOwnMessage }) => {
  const platform = link.platform;
  const platformName = getPlatformName(platform);
  const platformIcon = getPlatformIcon(platform);
  const urlInfo = getUrlInfo(link.url, platform);
  
  return (
    <div className="mt-2 mb-2">
      <div className={`border rounded-lg p-3 transition-colors hover:bg-opacity-80 ${
        isOwnMessage 
          ? 'border-indigo-300 bg-indigo-700/30 hover:bg-indigo-700/40' 
          : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{platformIcon}</span>
          <span className={`text-sm font-medium ${
            isOwnMessage 
              ? 'text-indigo-100' 
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {platformName}
          </span>
        </div>
        <div className="space-y-1">
          <p className={`text-sm font-medium ${
            isOwnMessage 
              ? 'text-indigo-100' 
              : 'text-gray-800 dark:text-gray-200'
          }`}>
            {urlInfo}
          </p>
          <a 
            href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs break-all hover:underline inline-flex items-center gap-1 ${
              isOwnMessage 
                ? 'text-indigo-200 hover:text-indigo-100' 
                : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
            }`}
          >
            Open link
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
              <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

// Render link previews and embeds for a message
export const renderLinkPreviews = (messageText, isOwnMessage) => {
  const detectedLinks = detectLinks(messageText);
  if (detectedLinks.length === 0) return null;
  
  return detectedLinks.map((link, index) => {
    // Render YouTube embed
    if (link.platform === SUPPORTED_PLATFORMS.YOUTUBE && link.videoId) {
      return (
        <YouTubeEmbed 
          key={`youtube-${index}`}
          videoId={link.videoId} 
          isOwnMessage={isOwnMessage}
        />
      );
    }
    
    // Render link preview for other supported platforms
    return (
      <LinkPreview 
        key={`link-${index}`}
        link={link} 
        isOwnMessage={isOwnMessage}
      />
    );
  });
};
