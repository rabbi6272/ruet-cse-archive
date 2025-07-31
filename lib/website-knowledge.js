// Website Data and Search Functions
import { db } from '@/lib/firebase';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';

// Complete website terminology and features
export const WEBSITE_KNOWLEDGE = {
  // Platform Overview
  platform: {
    name: "RUET CSE Archive",
    fullName: "Rajshahi University of Engineering & Technology Computer Science & Engineering Archive",
    purpose: "Educational platform for CSE students at RUET",
    target: "RUET CSE students, alumni, and academic community",
    established: "2024",
    department: "Computer Science & Engineering",
    university: "Rajshahi University of Engineering & Technology (RUET)"
  },

  // Main Features and Sections
  features: {
    codeLibrary: {
      name: "Code Library",
      path: "/codelibrary",
      description: "Programming codes and snippets shared by students",
      features: [
        "Code snippet sharing",
        "Syntax highlighting",
        "Language filtering (C, C++, Java, Python, JavaScript, etc.)",
        "Author filtering",
        "Search functionality",
        "Like system",
        "Comment system",
        "Copy code functionality",
        "Dark/Light mode toggle"
      ],
      languages: ["C", "C++", "Java", "Python", "JavaScript", "HTML", "CSS", "SQL", "Assembly", "VHDL"],
      searchable: true
    },

    resources: {
      name: "Resources",
      path: "/resources",
      description: "Academic materials and study resources organized by year",
      yearWise: {
        "1st Year": {
          description: "C programming, logic gates, mathematics fundamentals",
          subjects: ["C Programming", "Mathematics", "Physics", "Chemistry", "Logic Gates"],
          driveLinks: ["/drive/1xbyCdj3XQ9AsCCF8ImI13HCo25JEhgUJ"]
        },
        "2nd Year": {
          description: "Advanced programming, data structures, algorithms",
          subjects: ["Data Structures", "Algorithms", "Object Oriented Programming", "Digital Logic"],
          driveLinks: []
        },
        "3rd Year": {
          description: "Operating Systems, Database, Software Engineering",
          subjects: ["Operating Systems", "Database Management", "Software Engineering", "Computer Networks"],
          driveLinks: []
        },
        "4th Year": {
          description: "Advanced topics, thesis, capstone projects",
          subjects: ["Machine Learning", "AI", "Thesis", "Capstone Project"],
          driveLinks: []
        }
      },
      searchable: true
    },

    bookshelf: {
      name: "Bookshelf",
      path: "/shelf",
      description: "Digital library of academic books and materials",
      categories: [
        "Physics",
        "Mathematics", 
        "Chemistry",
        "C Programming",
        "Computer Science",
        "Computer Hardware",
        "Software Engineering",
        "Data Structures",
        "Algorithms",
        "Database Systems",
        "Operating Systems",
        "Computer Networks",
        "Machine Learning",
        "Artificial Intelligence"
      ],
      features: [
        "Google Drive integration",
        "YouTube links for video content",
        "Subject-wise organization",
        "Download links",
        "Preview functionality"
      ],
      searchable: true
    },

    alumni: {
      name: "Alumni Network",
      path: "/alumni",
      description: "Connect with RUET CSE graduates worldwide",
      features: [
        "Interactive world map",
        "Alumni locations",
        "Professional information",
        "LinkedIn profiles",
        "Graduation years from 1998 onwards",
        "Professional badges (teacher, researcher, corporate, etc.)",
        "Geographic distribution"
      ],
      badges: ["teacher", "highereducated", "researcher", "corporate", "teamleader"],
      searchable: true
    },

    doubtsSystem: {
      name: "Doubts & Help System",
      path: "/contact&help/doubts",
      description: "Submit coding doubts and get help from reviewers",
      categories: [
        "Environment bug",
        "Code not running", 
        "Compiler error",
        "Debug my code",
        "Give me hint",
        "Explain the idea",
        "Explain the code"
      ],
      workflow: [
        "Submit doubt with title, category, description",
        "Attach code files (up to 100KB)",
        "Reviewers assign and solve doubts",
        "Users receive notifications",
        "Mark solutions as satisfactory",
        "Archive resolved doubts publicly"
      ],
      features: [
        "File attachment support",
        "Real-time notifications",
        "Status tracking (pending/assigned/resolved)",
        "Public archive of solutions",
        "Search and filter in archive"
      ]
    },

    drive: {
      name: "Drive",
      path: "/drive",
      description: "File storage and sharing system integrated with Google Drive",
      features: [
        "Google Drive integration",
        "File sharing",
        "Folder organization",
        "Download functionality",
        "File preview"
      ]
    },

    userDashboard: {
      name: "User Dashboard",
      path: "/user/dashboard",
      description: "Personal space for students",
      features: [
        "Profile management",
        "Activity tracking",
        "Submitted doubts tracking",
        "Personal statistics",
        "Notification center"
      ]
    },

    reviewersDashboard: {
      name: "Reviewers Dashboard",
      path: "/reviewers/dashboard",
      description: "Dashboard for code reviewers and moderators",
      features: [
        "View pending doubts",
        "Assign doubts to reviewers",
        "Solve and respond to doubts",
        "Real-time updates",
        "Reviewer statistics"
      ],
      access: "Authorized reviewers only"
    }
  },

  // Academic Information
  academics: {
    subjects: {
      "1st Year": [
        "C Programming",
        "Mathematics I & II", 
        "Physics I & II",
        "Chemistry",
        "Engineering Drawing",
        "Logic Gates",
        "Digital Electronics"
      ],
      "2nd Year": [
        "Data Structures",
        "Algorithms",
        "Object Oriented Programming",
        "Digital Logic Design",
        "Computer Organization",
        "Mathematics III",
        "Statistics"
      ],
      "3rd Year": [
        "Operating Systems",
        "Database Management Systems",
        "Software Engineering",
        "Computer Networks",
        "Compiler Design",
        "Computer Graphics",
        "System Analysis"
      ],
      "4th Year": [
        "Machine Learning",
        "Artificial Intelligence",
        "Distributed Systems",
        "Information Security",
        "Thesis",
        "Capstone Project"
      ]
    },
    
    programmingLanguages: [
      "C", "C++", "Java", "Python", "JavaScript", "HTML", "CSS", 
      "SQL", "Assembly", "VHDL", "MATLAB", "R", "PHP", "Go", "Rust"
    ],

    googleClassrooms: {
      "CSE": "2o2ea2k3",
      "Math": "aq4vazqi", 
      "Chemistry": "wnlwjtbg"
    }
  },

  // Navigation and User Interface
  navigation: {
    mainSections: [
      { name: "Home", path: "/" },
      { name: "Code Library", path: "/codelibrary" },
      { name: "Resources", path: "/resources" },
      { name: "Alumni", path: "/alumni" },
      { name: "Contact & Help", path: "/contact&help" },
      { name: "Drive", path: "/drive" },
      { name: "Shelf", path: "/shelf" },
      { name: "User Dashboard", path: "/user/dashboard" }
    ],
    
    helpSubmenu: [
      { name: "Developers", path: "/contact&help/developers" },
      { name: "Doubts", path: "/contact&help/doubts" },
      { name: "Help", path: "/contact&help/help" },
      { name: "Statistics", path: "/contact&help/statistics" }
    ]
  },

  // Technical Terms and Concepts
  terms: {
    "Code Snippet": "A small block of reusable code shared in the Code Library",
    "Doubt": "A coding question or problem submitted by users for help",
    "Reviewer": "Authorized person who can solve and respond to doubts", 
    "Archive": "Public collection of resolved doubts and solutions",
    "Drive Link": "Google Drive URL for accessing shared files and resources",
    "Alumni Badge": "Professional tag indicating career field (teacher, researcher, etc.)",
    "Notification": "Real-time alert about doubt status or platform updates",
    "Roll Number": "Student identification number at RUET",
    "Semester": "Academic term (1-1, 1-2, 2-1, 2-2, etc.)",
    "RUET": "Rajshahi University of Engineering & Technology",
    "CSE": "Computer Science & Engineering department",
    "Nutrinos": "The exclusive web currency/points system of RUET CSE Archive for gamifying user engagement",
    "Nutrinos Points": "Points earned for various platform activities like adding code, helping others, commenting, etc.",
    "Nutrinos Rank": "User ranking system based on total Nutrinos earned (Explorer, Contributor, Developer, Code Master, Tech Innovator, Code Architect)",
    "Nutrinos Level": "User level calculated from total Nutrinos (every 50 points = 1 level up)",
    "Nutrinos History": "Complete record of all Nutrinos transactions for a user with timestamps and reasons"
  },

  // Nutrinos Currency System
  nutrinosSystem: {
    name: "Nutrinos Points System",
    description: "Exclusive gamification currency for RUET CSE Archive platform",
    purpose: "Reward user engagement and encourage platform participation",
    
    // Point values for different actions
    pointValues: {
      // Code snippet related
      "Add Code Snippet": 10,
      "Edit Code Snippet": 1.5,
      "Delete Code Snippet": -3,
      
      // Comment system
      "Receive Comment": 1.5,
      "Make Comment": 2.5,
      "Edit Comment": 0.5,
      "Delete Comment": -2.5,
      
      // Reply system
      "Receive Reply": 0.25,
      "Make Reply": 1.5,
      "Edit Reply": 0.5,
      "Delete Reply": -2.5,
      
      // Doubt system
      "Ask Doubt": 5,
      "Solve Doubt": 10,
      
      // Engagement
      "Get Mentioned": 3,
      "Daily Visit": 0.15
    },
    
    // Ranking system
    ranks: {
      "Explorer": "0+ Nutrinos - Just getting started!",
      "Contributor": "100+ Nutrinos - Making valuable contributions",
      "Developer": "250+ Nutrinos - Active community member",
      "Code Master": "500+ Nutrinos - Skilled programmer and helper", 
      "Tech Innovator": "750+ Nutrinos - Advanced contributor",
      "Code Architect": "1000+ Nutrinos - Elite community leader"
    },
    
    // Level system
    levelCalculation: "Every 50 Nutrinos = 1 Level (Level 1 starts at 0-49 points)",
    
    // Features
    features: [
      "Real-time point tracking",
      "Complete transaction history",
      "Rank progression system", 
      "Level advancement",
      "Leaderboard rankings",
      "Achievement badges",
      "Motivational rewards",
      "Community recognition"
    ],
    
    // How to earn Nutrinos
    howToEarn: [
      "Share helpful code snippets (+10 points)",
      "Comment on posts (+2.5 points)",
      "Help solve doubts (+10 points)",
      "Ask meaningful questions (+5 points)",
      "Get mentioned by others (+3 points)",
      "Visit platform daily (+0.15 points)",
      "Receive comments on your content (+1.5 points)",
      "Engage in discussions through replies (+1.5 points)"
    ],
    
    // Storage and tracking
    dataStorage: {
      location: "Firebase Realtime Database under 'userNutrinos' node",
      structure: {
        totalNutrinos: "Current total points",
        nutrinosHistory: "Array of all transactions",
        lastVisit: "Last login timestamp",
        rank: "Current user rank",
        level: "Current user level",
        name: "User display name"
      }
    }
  }
};

// Search functionality for resources
export async function searchResources(query) {
  try {
    const resourcesData = WEBSITE_KNOWLEDGE.features.resources.yearWise;
    const results = [];
    
    const lowerQuery = query.toLowerCase();
    
    // Search through years and subjects
    Object.entries(resourcesData).forEach(([year, data]) => {
      // Check if year matches
      if (year.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'year',
          title: year,
          description: data.description,
          subjects: data.subjects,
          relevance: 1.0
        });
      }
      
      // Check subjects
      data.subjects.forEach(subject => {
        if (subject.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'subject',
            title: subject,
            year: year,
            description: `${subject} resources for ${year}`,
            relevance: 0.9
          });
        }
      });
    });
    
    return results.sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error('Error searching resources:', error);
    return [];
  }
}

// Search functionality for bookshelf
export async function searchBookshelf(query) {
  try {
    const bookshelfData = WEBSITE_KNOWLEDGE.features.bookshelf.categories;
    const results = [];
    
    const lowerQuery = query.toLowerCase();
    
    bookshelfData.forEach(category => {
      if (category.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'book_category',
          title: category,
          description: `Books and materials related to ${category}`,
          path: '/shelf',
          relevance: 1.0
        });
      }
    });
    
    return results.sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error('Error searching bookshelf:', error);
    return [];
  }
}

// Search functionality for code library
export async function searchCodeLibrary(query) {
  try {
    const languages = WEBSITE_KNOWLEDGE.features.codeLibrary.languages;
    const results = [];
    
    const lowerQuery = query.toLowerCase();
    
    languages.forEach(language => {
      if (language.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'programming_language',
          title: language,
          description: `${language} code snippets and examples`,
          path: '/codelibrary',
          relevance: 1.0
        });
      }
    });
    
    return results.sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error('Error searching code library:', error);
    return [];
  }
}

// Search functionality for alumni
export async function searchAlumni(query) {
  try {
    // This would typically fetch from Firebase, but for now return static info
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('alumni') || lowerQuery.includes('graduate')) {
      results.push({
        type: 'alumni_info',
        title: 'Alumni Network',
        description: 'Connect with RUET CSE graduates worldwide',
        path: '/alumni',
        relevance: 1.0
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error searching alumni:', error);
    return [];
  }
}

// Combined search function
export async function performSearch(query) {
  try {
    const [resourceResults, bookshelfResults, codeResults, alumniResults] = await Promise.all([
      searchResources(query),
      searchBookshelf(query),
      searchCodeLibrary(query),
      searchAlumni(query)
    ]);
    
    const allResults = [
      ...resourceResults,
      ...bookshelfResults, 
      ...codeResults,
      ...alumniResults
    ];
    
    return allResults.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  } catch (error) {
    console.error('Error performing search:', error);
    return [];
  }
}

export default WEBSITE_KNOWLEDGE;
