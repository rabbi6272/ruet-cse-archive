// Test file to verify link detection functionality
// This can be run in browser console to test the link detection

const SUPPORTED_PLATFORMS = {
  YOUTUBE: 'youtube',
  CODEFORCES: 'codeforces',
  ATCODER: 'atcoder',
  LEETCODE: 'leetcode',
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
  GOOGLE: 'google',
  FACEBOOK: 'facebook'
};

const URL_PATTERNS = {
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
  [SUPPORTED_PLATFORMS.LEETCODE]: [
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/problems\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/[\w-]+/i,
    /(?:https?:\/\/)?(?:www\.)?leetcode\.com\/discuss\/[\w\/-]+/i
  ],
  [SUPPORTED_PLATFORMS.GITHUB]: [
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+(?:\/.*)?/i
  ]
};

const getYouTubeVideoId = (url) => {
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

const detectLinks = (text) => {
  const links = [];
  const foundUrls = new Set();
  
  Object.entries(URL_PATTERNS).forEach(([platform, patterns]) => {
    patterns.forEach(pattern => {
      const globalPattern = new RegExp(pattern.source, 'gi');
      let match;
      
      while ((match = globalPattern.exec(text)) !== null) {
        const url = match[0];
        const normalizedUrl = url.toLowerCase();
        
        if (!foundUrls.has(normalizedUrl)) {
          foundUrls.add(normalizedUrl);
          
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

// Test cases
const testMessages = [
  "Check out this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "Short link: https://youtu.be/dQw4w9WgXcQ",
  "Codeforces problem: https://codeforces.com/problemset/problem/1A",
  "My GitHub repo: https://github.com/username/repository",
  "LeetCode problem: https://leetcode.com/problems/two-sum/",
  "Multiple links: Check https://youtube.com/watch?v=abc123 and https://github.com/test/repo",
  "No links in this message",
  "AtCoder contest: https://atcoder.jp/contests/abc123/tasks/abc123_a"
];

console.log("Testing Link Detection:");
testMessages.forEach((message, index) => {
  console.log(`\nTest ${index + 1}: "${message}"`);
  const detected = detectLinks(message);
  console.log("Detected links:", detected);
});
