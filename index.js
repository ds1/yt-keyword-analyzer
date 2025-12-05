// YT-Keyword-Analyzer MCP Server
// Analyzes keywords for competition, search volume, and optimization potential

const WebSocket = require('ws');

class YTKeywordAnalyzer {
  constructor() {
    this.name = 'YT-Keyword-Analyzer';
    this.version = '1.0.0';
    this.capabilities = ['youtube', 'keywords', 'analyze', 'competition'];
    this.port = process.env.PORT || 3000;

    // Simulated competition data patterns
    this.competitionPatterns = {
      highCompetition: ['tutorial', 'how to', 'best', 'review', 'top 10', 'guide'],
      mediumCompetition: ['tips', 'tricks', 'explained', 'walkthrough', 'demo'],
      lowCompetition: ['mistakes', 'underrated', 'hidden', 'secret', 'advanced']
    };

    // Trending topics boost
    this.trendingTopics = ['ai', 'chatgpt', 'automation', '2025', '2024', 'shorts', 'viral'];
  }

  start() {
    const wss = new WebSocket.Server({ port: this.port });

    wss.on('connection', (ws) => {
      console.log(`[${new Date().toISOString()}] Client connected`);

      ws.on('message', async (message) => {
        try {
          const request = JSON.parse(message.toString());
          console.log(`[${new Date().toISOString()}] Received:`, request.method);

          const response = await this.handleRequest(request);
          ws.send(JSON.stringify(response));
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error' },
            id: null
          }));
        }
      });

      ws.on('close', () => {
        console.log(`[${new Date().toISOString()}] Client disconnected`);
      });
    });

    console.log(`🚀 ${this.name} MCP server running on port ${this.port}`);

    if (process.env.REPLIT_ENVIRONMENT === 'production') {
      console.log(`📡 Published WebSocket URL: wss://yt-keyword-analyzer-agt.replit.app`);
    } else {
      console.log(`📡 Dev WebSocket URL: ws://localhost:${this.port}`);
    }
  }

  async handleRequest(request) {
    const { method, params, id } = request;

    switch(method) {
      case 'ping':
        return this.handlePing(id);

      case 'tools/list':
        return this.handleToolsList(id);

      case 'tools/call':
        return await this.handleToolCall(params, id);

      default:
        return {
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id
        };
    }
  }

  handlePing(id) {
    return {
      jsonrpc: '2.0',
      result: {
        status: 'ok',
        agent: this.name,
        version: this.version,
        timestamp: new Date().toISOString()
      },
      id
    };
  }

  handleToolsList(id) {
    return {
      jsonrpc: '2.0',
      result: {
        tools: [
          {
            name: 'analyzeKeywords',
            description: 'Analyze keywords for competition, search volume, and SEO potential',
            inputSchema: {
              type: 'object',
              properties: {
                keywords: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      keyword: { type: 'string' },
                      category: { type: 'string' },
                      searchVolume: { type: 'string' },
                      competition: { type: 'string' },
                      relevance: { type: 'number' }
                    }
                  },
                  description: 'Array of keywords from brainstormer'
                },
                concept: {
                  type: 'string',
                  description: 'Original video concept'
                },
                targetAudience: {
                  type: 'string',
                  description: 'Target audience'
                },
                niche: {
                  type: 'string',
                  description: 'Content niche (tech, gaming, lifestyle, etc.)'
                }
              },
              required: ['keywords']
            }
          }
        ]
      },
      id
    };
  }

  async handleToolCall(params, id) {
    const { name, arguments: args } = params;

    if (name !== 'analyzeKeywords') {
      return {
        jsonrpc: '2.0',
        error: { code: -32602, message: `Unknown tool: ${name}` },
        id
      };
    }

    try {
      const result = await this.analyzeKeywords(args);
      return {
        jsonrpc: '2.0',
        result: {
          content: result
        },
        id
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        error: { code: -32603, message: error.message },
        id
      };
    }
  }

  async analyzeKeywords({ keywords, concept, targetAudience, niche }) {
    if (!keywords || !Array.isArray(keywords)) {
      throw new Error('Keywords array is required');
    }

    console.log(`Analyzing ${keywords.length} keywords...`);

    const analyzedKeywords = keywords.map(kw => this.analyzeKeyword(kw, niche));

    // Sort by opportunity score
    analyzedKeywords.sort((a, b) => b.opportunityScore - a.opportunityScore);

    // Categorize results
    const topKeywords = analyzedKeywords.filter(k => k.opportunityScore >= 70);
    const goodKeywords = analyzedKeywords.filter(k => k.opportunityScore >= 50 && k.opportunityScore < 70);
    const lowPriorityKeywords = analyzedKeywords.filter(k => k.opportunityScore < 50);

    // Generate insights
    const insights = this.generateInsights(analyzedKeywords, concept, niche);

    // Select recommended primary and secondary keywords
    const recommended = {
      primary: topKeywords.slice(0, 3),
      secondary: goodKeywords.slice(0, 5),
      longTail: analyzedKeywords.filter(k => k.category === 'long-tail').slice(0, 10)
    };

    return {
      concept: concept || 'Not specified',
      targetAudience: targetAudience || 'general',
      niche: niche || 'general',
      analyzedAt: new Date().toISOString(),
      totalAnalyzed: analyzedKeywords.length,
      summary: {
        topOpportunities: topKeywords.length,
        goodOpportunities: goodKeywords.length,
        lowPriority: lowPriorityKeywords.length,
        averageOpportunityScore: Math.round(
          analyzedKeywords.reduce((sum, k) => sum + k.opportunityScore, 0) / analyzedKeywords.length
        )
      },
      recommended,
      allKeywords: analyzedKeywords,
      insights,
      nextSteps: [
        `Use "${recommended.primary[0]?.keyword || 'top keyword'}" as your main title keyword`,
        'Incorporate secondary keywords naturally in your description',
        'Use long-tail keywords in your video script for voice search optimization',
        'Monitor trending topics for timely content opportunities'
      ]
    };
  }

  analyzeKeyword(keywordData, _niche) {
    // Handle both string and object input formats
    const keyword = (typeof keywordData === 'string' ? keywordData : keywordData.keyword).toLowerCase();
    const inputData = typeof keywordData === 'string' ? { keyword: keywordData } : keywordData;

    // Calculate competition score (0-100, lower is better)
    let competitionScore = 50; // Base score

    // Adjust based on keyword patterns
    for (const pattern of this.competitionPatterns.highCompetition) {
      if (keyword.includes(pattern)) {
        competitionScore += 15;
        break;
      }
    }

    for (const pattern of this.competitionPatterns.mediumCompetition) {
      if (keyword.includes(pattern)) {
        competitionScore += 5;
        break;
      }
    }

    for (const pattern of this.competitionPatterns.lowCompetition) {
      if (keyword.includes(pattern)) {
        competitionScore -= 20;
        break;
      }
    }

    // Long-tail keywords have lower competition
    if (keyword.split(' ').length >= 4) {
      competitionScore -= 15;
    }

    // Clamp competition score
    competitionScore = Math.max(10, Math.min(95, competitionScore));

    // Calculate search volume score (0-100, higher is better)
    let volumeScore = 50;

    switch (inputData.searchVolume) {
      case 'high': volumeScore = 85; break;
      case 'medium': volumeScore = 60; break;
      case 'low': volumeScore = 35; break;
    }

    // Trending topics boost
    for (const topic of this.trendingTopics) {
      if (keyword.includes(topic)) {
        volumeScore = Math.min(100, volumeScore + 15);
        break;
      }
    }

    // Calculate trend direction
    const trendDirection = this.calculateTrendDirection(keyword);

    // Calculate opportunity score
    // High volume + low competition = high opportunity
    const opportunityScore = Math.round(
      (volumeScore * 0.4) +
      ((100 - competitionScore) * 0.4) +
      ((inputData.relevance || 0.5) * 20)
    );

    // Difficulty rating
    let difficulty;
    if (competitionScore >= 70) difficulty = 'hard';
    else if (competitionScore >= 40) difficulty = 'medium';
    else difficulty = 'easy';

    return {
      keyword: inputData.keyword,
      category: inputData.category || 'general',
      analysis: {
        competitionScore,
        competitionLevel: competitionScore >= 70 ? 'high' : competitionScore >= 40 ? 'medium' : 'low',
        volumeScore,
        volumeLevel: volumeScore >= 70 ? 'high' : volumeScore >= 40 ? 'medium' : 'low',
        trendDirection,
        difficulty
      },
      relevance: inputData.relevance || 0.5,
      opportunityScore,
      opportunityRating: opportunityScore >= 70 ? 'excellent' : opportunityScore >= 50 ? 'good' : 'low',
      recommendation: this.getKeywordRecommendation(opportunityScore, inputData.category || 'general')
    };
  }

  calculateTrendDirection(keyword) {
    // Simulate trend calculation
    const trendingUp = this.trendingTopics.some(t => keyword.includes(t));
    const hasYear = /202[4-9]/.test(keyword);

    if (trendingUp || hasYear) return 'rising';
    if (keyword.includes('classic') || keyword.includes('traditional')) return 'stable';

    // Random variation for simulation
    const rand = Math.random();
    if (rand > 0.7) return 'rising';
    if (rand > 0.3) return 'stable';
    return 'declining';
  }

  getKeywordRecommendation(score, category) {
    if (score >= 70) {
      return category === 'primary'
        ? 'Highly recommended for title'
        : 'Strong candidate for description/tags';
    }
    if (score >= 50) {
      return 'Good supporting keyword for description';
    }
    return 'Consider for long-form content or tags only';
  }

  generateInsights(analyzedKeywords, concept, niche) {
    const insights = [];

    // Check for keyword gaps
    const categories = analyzedKeywords.map(k => k.category);
    if (!categories.includes('long-tail')) {
      insights.push({
        type: 'gap',
        message: 'Consider adding more long-tail keywords for better voice search optimization'
      });
    }

    // Check trend alignment
    const risingKeywords = analyzedKeywords.filter(k => k.analysis.trendDirection === 'rising');
    if (risingKeywords.length > 0) {
      insights.push({
        type: 'opportunity',
        message: `${risingKeywords.length} keywords are trending up - prioritize these for timely content`,
        keywords: risingKeywords.slice(0, 3).map(k => k.keyword)
      });
    }

    // Competition analysis
    const easyWins = analyzedKeywords.filter(k => k.analysis.difficulty === 'easy' && k.analysis.volumeScore >= 40);
    if (easyWins.length > 0) {
      insights.push({
        type: 'quick-win',
        message: `Found ${easyWins.length} low-competition keywords with decent volume`,
        keywords: easyWins.slice(0, 3).map(k => k.keyword)
      });
    }

    // Niche-specific insight
    if (niche) {
      insights.push({
        type: 'niche',
        message: `For ${niche} content, focus on specific terminology and community language`
      });
    }

    return insights;
  }
}

// Start the server
const server = new YTKeywordAnalyzer();
server.start();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing WebSocket server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing WebSocket server');
  process.exit(0);
});
