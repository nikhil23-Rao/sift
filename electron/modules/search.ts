import { GoogleGenerativeAI } from '@google/generative-ai';

const TAVILY_API_KEY = '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';
// Using process.env for Gemini API Key in Electron backend
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function handleStudentSearch(query: string, institutionName?: string) {
  try {
    // 1. Parse @ commands and determine search strategy
    const redditMatch = query.match(/@reddit\b/i);
    const youtubeMatch = query.match(/@youtube\b/i);
    const khanMatch = query.match(/@khanacademy\b/i);
    const deepSearchMatch = query.match(/@(deepsearch|deep search|web)\b/i);

    const isSpecializedSearch = redditMatch || youtubeMatch || khanMatch || deepSearchMatch;
    
    // Clean query from @ commands
    const cleanQuery = query.replace(/@[a-zA-Z0-9-]+\b/g, '').trim();

    // Check if institution is relevant (contains campus keywords or institution name)
    const isInstitutionRelevant = institutionName && (
      cleanQuery.toLowerCase().includes(institutionName.toLowerCase()) ||
      /\b(campus|professor|course|major|club|dorm|admissions|tuition|registrar|university|college|school|class|department)\b/i.test(cleanQuery)
    );

    if (!isSpecializedSearch) {
      // STRATEGY: General Search (Gemini Direct)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `
        You are an expert academic resource finder. 
        User Query: "${cleanQuery}"
        ${isInstitutionRelevant ? `Institution: "${institutionName}"` : ''}
        
        Provide a concise, helpful response that serves as a guide to finding resources or answering the query directly. 
        Focus on being brief and providing immediate value.
        Format in Markdown. 
      `;
      const result = await model.generateContent(prompt);
      return {
        answer: result.response.text(),
        sources: [], // No real-time web sources for general AI query
      };
    }

    // STRATEGY: Specialized/Web Search (Tavily)
    let searchFilter = '';
    if (redditMatch) searchFilter = 'site:reddit.com';
    else if (youtubeMatch) searchFilter = 'site:youtube.com';
    else if (khanMatch) searchFilter = 'site:khanacademy.org';

    const searchQuery = isInstitutionRelevant
      ? `${cleanQuery} ${searchFilter} "${institutionName}"`
      : `${cleanQuery} ${searchFilter}`;

    // 2. Call Tavily API
    const searchResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: deepSearchMatch ? 'advanced' : 'basic',
        include_images: false,
        include_answer: false,
        max_results: 5,
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Tavily search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const results: SearchResult[] = searchData.results || [];

    // 3. Synthesize with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const sourcesContext = results
      .map((r, i) => `Source [${i + 1}]: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
      .join('\n\n');

    const systemPrompt = `
      You are an expert resource finder and academic assistant. 
      Synthesize a concise response based on these search results for the query: "${cleanQuery}"
      
      Instructions:
      1. Be extremely concise. Focus on finding and summarizing the best resources.
      2. Format in Markdown with inline citations [1], [2], etc.
      3. Prioritize results from ${searchFilter || 'the web'}.
      4. If institution "${institutionName || 'N/A'}" is relevant, include it briefly.
      5. Use bullet points for clarity and quick scanning.
      
      Context:
      ${sourcesContext}
    `;

    const result = await model.generateContent(systemPrompt);
    return {
      answer: result.response.text(),
      sources: results.map((r, i) => ({
        id: i + 1,
        title: r.title,
        url: r.url,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(r.url).hostname}&sz=32`,
      })),
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}
