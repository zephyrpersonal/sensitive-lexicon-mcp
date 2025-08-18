#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { SensitiveDetector } from './sensitive-detector.js';

const detector = new SensitiveDetector();

const server = new Server(
  {
    name: 'sensitive-lexicon-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'detect_sensitive_words',
        description: 'Detect sensitive words in text using the Sensitive-lexicon library',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to check for sensitive words',
            },
            categories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional: specific categories to check (e.g., ["political", "violence"])',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'filter_sensitive_words',
        description: 'Filter sensitive words from text by replacing them with a replacement string',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to filter',
            },
            replacement: {
              type: 'string',
              description: 'String to replace sensitive words with (default: "***")',
              default: '***',
            },
            categories: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional: specific categories to filter (e.g., ["political", "violence"])',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'get_categories',
        description: 'Get list of available sensitive word categories',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_word_count',
        description: 'Get the number of words in the sensitive word database',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Optional: get count for specific category only',
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'detect_sensitive_words': {
        const { text, categories } = args as { text: string; categories?: string[] };
        
        if (!detector) {
          throw new McpError(ErrorCode.InternalError, 'Detector not initialized');
        }

        const result = detector.detect(text, categories);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                isSensitive: result.isSensitive,
                sensitiveWordsCount: result.sensitiveWords.length,
                sensitiveWords: result.sensitiveWords,
                summary: result.isSensitive 
                  ? `Found ${result.sensitiveWords.length} sensitive word(s) in the text`
                  : 'No sensitive words detected'
              }, null, 2),
            },
          ],
        };
      }

      case 'filter_sensitive_words': {
        const { text, replacement = '***', categories } = args as { 
          text: string; 
          replacement?: string; 
          categories?: string[] 
        };
        
        if (!detector) {
          throw new McpError(ErrorCode.InternalError, 'Detector not initialized');
        }

        const result = detector.filter(text, replacement, categories);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                originalText: result.originalText,
                filteredText: result.filteredText,
                isSensitive: result.isSensitive,
                sensitiveWordsFound: result.sensitiveWords.length,
                sensitiveWords: result.sensitiveWords
              }, null, 2),
            },
          ],
        };
      }

      case 'get_categories': {
        if (!detector) {
          throw new McpError(ErrorCode.InternalError, 'Detector not initialized');
        }

        const categories = detector.getAvailableCategories();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                categories,
                totalCategories: categories.length
              }, null, 2),
            },
          ],
        };
      }

      case 'get_word_count': {
        const { category } = args as { category?: string };
        
        if (!detector) {
          throw new McpError(ErrorCode.InternalError, 'Detector not initialized');
        }

        const count = detector.getWordCount(category);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                category: category || 'all',
                wordCount: count
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

async function main() {
  try {
    console.error('Initializing sensitive word detector...');
    await detector.initialize();
    console.error('Detector initialized successfully');
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Sensitive Lexicon MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();