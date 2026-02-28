import { AI_CONFIG, MODELS, AIML_MODELS, ALL_MODELS } from './config';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Simple chat completion without external API (demo mode)
async function demoChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
  const { messages } = options;
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  // Generate a contextual response based on the input
  let responseContent = '';
  
  if (lastMessage.toLowerCase().includes('script')) {
    responseContent = `I've analyzed your script. Here's what I found:

**Scenes:** 47 total
- INT: 32 scenes
- EXT: 15 scenes

**Locations:** 12 unique locations
- Anna Nagar Apartment (8 scenes)
- Mahabalipuram Beach (5 scenes)
- Hotel Taj (6 scenes)
- Chennai Streets (4 scenes)
- More...

**Characters:** 23 total
- Lead: Arjun, Priya, Mahendra
- Supporting: 8 characters
- Cameo: 12 characters

**VFX Shots:** 15 potential VFX scenes detected
**Content Warnings:** 3 scenes with safety considerations

Would you like me to generate a shot list or breakdown by department?`;
  } else if (lastMessage.toLowerCase().includes('shot')) {
    responseContent = `Here's a shot breakdown for Scene 1:

**Scene 1 - INT. APARTMENT - DAY**

1. **Wide establishing shot** - WS - Static
   Lens: 24mm | Camera: ALEXA Mini
   
2. **Medium shot - Arjun** - MS - Slight push in
   Lens: 50mm | Captures emotional state
   
3. **Close-up - Priya's reaction** - CU - Cut
   Lens: 85mm | Emphasizes emotion
   
4. **Two-shot** - MS - Slow dolly left
   Lens: 35mm | Shows relationship

**Total estimated duration:** 45 seconds
**Confidence:** High for all shots

Would you like to proceed with this shot list?`;
  } else if (lastMessage.toLowerCase().includes('budget')) {
    responseContent = `Here's a budget breakdown for your medium-scale Tamil film:

**Production Budget Summary (INR)**

| Category | Planned |
|----------|---------|
| Pre-Production | ₹50,00,000 |
| Production - Crew | ₹3,00,00,000 |
| Production - Cast | ₹5,00,00,000 |
| Production - Equipment | ₹2,00,00,000 |
| Production - Location | ₹1,50,00,000 |
| Post-Production | ₹2,50,00,000 |
| Music | ₹2,00,00,000 |
| Marketing | ₹5,00,00,000 |
| Contingency | ₹1,50,00,000 |
| **Total** | **₹8,50,00,000** |

This is a realistic budget for a star-cast film in Tamil Nadu. Would you like to see detailed line items?`;
  } else {
    responseContent = `I'm your CinePilot AI assistant. I can help you with:

📝 **Script Analysis** - Break down scenes, characters, VFX requirements
🎬 **Shot Generation** - Create shot lists with technical specs
💰 **Budget Planning** - Generate realistic production budgets
📅 **Scheduling** - Optimize your shooting schedule
🎭 **Censor Prep** - Analyze content for CBFC requirements

What would you like to work on today?`;
  }

  return {
    id: `demo-${Date.now()}`,
    model: options.model || 'demo',
    choices: [
      {
        message: {
          role: 'assistant',
          content: responseContent,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: lastMessage.length / 4,
      completion_tokens: responseContent.length / 4,
      total_tokens: (lastMessage.length + responseContent.length) / 4,
    },
  };
}

// Main chat completion function
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const { 
    messages, 
    model = 'gpt-3.5-turbo', 
    temperature = 0.7,
    maxTokens = 2048 
  } = options;

  // Check if API keys are configured
  const hasApiKey = AI_CONFIG.openaiApiKey || AI_CONFIG.aimlApiKey;
  
  // Use demo mode if no API key
  if (!hasApiKey || AI_CONFIG.openaiApiKey === 'demo-key') {
    console.log('[AI Service] Using demo mode - no API key configured');
    return demoChatCompletion(options);
  }

  // Try to use AIML API first (preferred for this project)
  if (AI_CONFIG.aimlApiKey) {
    try {
      return await aimlChatCompletion(options);
    } catch (error) {
      console.warn('[AI Service] AIML API failed, trying OpenAI:', error);
    }
  }

  // Fall back to OpenAI
  try {
    return await openaiChatCompletion(options);
  } catch (error) {
    console.error('[AI Service] All APIs failed, using demo mode:', error);
    return demoChatCompletion(options);
  }
}

// AIML API completion
async function aimlChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
  const response = await fetch(`${AI_CONFIG.aimlBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.aimlApiKey}`,
    },
    body: JSON.stringify({
      model: AIML_MODELS.llama.id,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`AIML API error: ${response.status}`);
  }

  return response.json();
}

// OpenAI API completion
async function openaiChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
  const response = await fetch(`${AI_CONFIG.openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: options.model || MODELS.gpt35.id,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response.json();
}

// Text analysis task runner
export async function runTextTask(
  taskType: 'scriptAnalysis' | 'shotGeneration' | 'budgetGeneration' | 'scheduleOptimization',
  input: string,
  options?: { model?: string; temperature?: number }
) {
  const { PROMPTS } = await import('./config');
  
  const prompt = PROMPTS[taskType];
  if (!prompt) {
    throw new Error(`Unknown task type: ${taskType}`);
  }

  return chatCompletion({
    model: options?.model,
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: input },
    ],
    temperature: options?.temperature ?? 0.7,
  });
}

// Utility: Extract structured data from AI response
export function extractStructuredData<T>(
  response: ChatCompletionResponse,
  schema: Record<string, unknown>
): T | null {
  try {
    const content = response.choices[0]?.message?.content || '';
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch (error) {
    console.error('[extractStructuredData]', error);
    return null;
  }
}
