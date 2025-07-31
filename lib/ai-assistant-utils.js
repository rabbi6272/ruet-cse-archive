// AI Assistant Utility Functions
import WEBSITE_KNOWLEDGE from './website-knowledge.js';

// Generate contextual responses based on user intent
export function generateContextualResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  const platform = WEBSITE_KNOWLEDGE.platform;
  const features = WEBSITE_KNOWLEDGE.features;
  
  // Code-related queries
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('snippet')) {
    return {
      section: 'Code Library',
      path: '/codelibrary',
      description: 'Browse programming code snippets, examples, and implementations',
      features: features.codeLibrary.features,
      languages: features.codeLibrary.languages
    };
  }
  
  // Resource-related queries
  if (lowerMessage.includes('resource') || lowerMessage.includes('study material') || lowerMessage.includes('academic')) {
    return {
      section: 'Resources',
      path: '/resources',
      description: 'Access year-wise academic materials and study resources',
      yearWise: features.resources.yearWise
    };
  }
  
  // Book-related queries
  if (lowerMessage.includes('book') || lowerMessage.includes('pdf') || lowerMessage.includes('textbook')) {
    return {
      section: 'Bookshelf',
      path: '/shelf',
      description: 'Digital library with academic books and materials',
      categories: features.bookshelf.categories
    };
  }
  
  // Alumni-related queries
  if (lowerMessage.includes('alumni') || lowerMessage.includes('graduate') || lowerMessage.includes('senior')) {
    return {
      section: 'Alumni Network',
      path: '/alumni',
      description: 'Connect with RUET CSE graduates worldwide',
      features: features.alumni.features
    };
  }
  
  // Help/Doubt-related queries
  if (lowerMessage.includes('help') || lowerMessage.includes('doubt') || lowerMessage.includes('question') || lowerMessage.includes('problem')) {
    return {
      section: 'Doubts & Help System',
      path: '/contact&help/doubts',
      description: 'Submit coding doubts and get help from reviewers',
      categories: features.doubtsSystem.categories,
      workflow: features.doubtsSystem.workflow
    };
  }
  
  return null;
}

// Format academic information
export function formatAcademicInfo(year) {
  const academics = WEBSITE_KNOWLEDGE.academics;
  
  if (academics.subjects[year]) {
    return {
      year: year,
      subjects: academics.subjects[year],
      description: `Academic subjects and topics for ${year} CSE students`
    };
  }
  
  return null;
}

// Get programming language information
export function getProgrammingLanguageInfo(language) {
  const languages = WEBSITE_KNOWLEDGE.academics.programmingLanguages;
  const normalizedLang = language.toLowerCase();
  
  const foundLang = languages.find(lang => lang.toLowerCase() === normalizedLang);
  
  if (foundLang) {
    return {
      language: foundLang,
      available: true,
      section: 'Code Library',
      path: '/codelibrary',
      description: `Find ${foundLang} code examples, snippets, and implementations in the Code Library`
    };
  }
  
  return {
    language: language,
    available: false,
    suggestion: 'Check the Code Library for available programming languages and examples'
  };
}

// Get feature explanation
export function explainFeature(featureName) {
  const features = WEBSITE_KNOWLEDGE.features;
  const lowerFeature = featureName.toLowerCase();
  
  // Find matching feature
  for (const [key, feature] of Object.entries(features)) {
    if (key.toLowerCase().includes(lowerFeature) || 
        feature.name.toLowerCase().includes(lowerFeature)) {
      return {
        name: feature.name,
        path: feature.path,
        description: feature.description,
        features: feature.features || [],
        additionalInfo: feature.categories || feature.yearWise || feature.workflow || null
      };
    }
  }
  
  return null;
}

// Get navigation help
export function getNavigationHelp() {
  const navigation = WEBSITE_KNOWLEDGE.navigation;
  
  return {
    mainSections: navigation.mainSections,
    helpSubmenu: navigation.helpSubmenu,
    description: 'Here are all the main sections you can explore on the platform'
  };
}

// Format search results for better display
export function formatSearchResults(results) {
  if (!results || results.length === 0) {
    return "I couldn't find specific matches for your query, but I can help you navigate to the relevant sections.";
  }
  
  let formatted = "Here's what I found for you:\n\n";
  
  results.forEach((result, index) => {
    formatted += `**${index + 1}. ${result.title}**\n`;
    formatted += `${result.description}\n`;
    
    if (result.path) {
      formatted += `🔗 Access: ${result.path}\n`;
    }
    
    if (result.year) {
      formatted += `📚 Academic Year: ${result.year}\n`;
    }
    
    formatted += "\n";
  });
  
  return formatted;
}

// Generate quick action suggestions
export function getQuickActions(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  const suggestions = [];
  
  if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('new')) {
    suggestions.push(
      "🏠 Explore the Homepage for platform overview",
      "📚 Check Resources for study materials",
      "💻 Visit Code Library for programming examples",
      "❓ Use Doubts system if you need help"
    );
  }
  
  if (lowerMessage.includes('learn') || lowerMessage.includes('study')) {
    suggestions.push(
      "📖 Browse Bookshelf for textbooks and references",
      "📝 Access Resources for year-wise materials", 
      "💡 Check solved doubts in the archive",
      "🎓 Connect with Alumni for guidance"
    );
  }
  
  if (lowerMessage.includes('code') || lowerMessage.includes('program')) {
    suggestions.push(
      "💻 Explore Code Library for examples",
      "❓ Submit a doubt if you're stuck",
      "📚 Find programming books in Bookshelf",
      "🔍 Search for specific language examples"
    );
  }
  
  return suggestions;
}

const aiAssistantUtils = {
  generateContextualResponse,
  formatAcademicInfo,
  getProgrammingLanguageInfo,
  explainFeature,
  getNavigationHelp,
  formatSearchResults,
  getQuickActions
};

export default aiAssistantUtils;
