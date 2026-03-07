import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// In-memory storage for demo mode
let messagesStore = [
  { id: 'wa-1', recipient: '+919876543210', recipientName: 'Ajith Kumar', message: '📅 Schedule Update\n\nDate: 15-03-2026\nTime: 6:00 AM\nLocation: Studio A', status: 'delivered', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'wa-2', recipient: '+919876543213', recipientName: 'Ravi K. Chandran', message: '⏰ Call Reminder\n\nDon\'t forget: 15-03-2026 at 5:00 AM', status: 'read', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'wa-3', recipient: '+919876543211', recipientName: 'Sai Pallavi', message: '🎬 Call Sheet\n\nScene: 24\nDate: 16-03-2026\nCall Time: 5:00 AM\nLocation: Beach Road', status: 'delivered', timestamp: new Date(Date.now() - 86400000).toISOString() },
];

// Demo message templates
let templatesStore = [
  { id: 'tpl-1', name: 'Call Sheet', content: '🎬 Call Sheet\n\nScene: {scene}\nDate: {date}\nCall Time: {callTime}\nLocation: {location}', category: 'production' },
  { id: 'tpl-2', name: 'Schedule Update', content: '📅 Schedule Update\n\nDate: {date}\nTime: {time}\nLocation: {location}', category: 'production' },
  { id: 'tpl-3', name: 'Reminder', content: '⏰ Reminder\n\n{message}', category: 'general' },
  { id: 'tpl-4', name: 'Location Change', content: '📍 Location Change\n\nNew Location: {location}\nReport to: {reportTime}', category: 'logistics' },
];

let isDemoMode = true;

// Check database connection
async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch {
    return false;
  }
}

// GET /api/whatsapp - list message history
export async function GET(req: NextRequest) {
  const dbConnected = await checkDbConnection();
  isDemoMode = !dbConnected;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // Handle /api/whatsapp/templates
  if (action === 'templates') {
    return NextResponse.json({ 
      templates: templatesStore,
      isDemoMode 
    });
  }

  // Default: return message history
  return NextResponse.json({ 
    messages: messagesStore,
    isDemoMode 
  });
}

// POST /api/whatsapp - send message or create template
export async function POST(req: NextRequest) {
  const dbConnected = await checkDbConnection();
  isDemoMode = !dbConnected;

  try {
    const body = await req.json();
    const { recipient, recipientName, message, templateId, action } = body;

    // Send a message
    if (action === 'send' || (!action && recipient && message)) {
      const newMessage = {
        id: `wa-${Date.now()}`,
        recipient,
        recipientName: recipientName || 'Unknown',
        message,
        status: isDemoMode ? 'delivered' : 'pending',
        timestamp: new Date().toISOString(),
      };
      
      messagesStore.unshift(newMessage);
      
      // In production, would integrate with WhatsApp Business API here
      // For demo mode, simulate delivery
      if (isDemoMode) {
        setTimeout(() => {
          const msg = messagesStore.find(m => m.id === newMessage.id);
          if (msg) msg.status = 'delivered';
        }, 1000);
      }

      return NextResponse.json({ 
        success: true, 
        message: newMessage,
        isDemoMode 
      });
    }

    // Create a template
    if (action === 'create_template' || action === 'template') {
      const newTemplate = {
        id: `tpl-${Date.now()}`,
        name: body.name || 'New Template',
        content: body.content || '',
        category: body.category || 'general',
      };
      
      templatesStore.push(newTemplate);
      
      return NextResponse.json({ 
        success: true, 
        template: newTemplate,
        isDemoMode 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// DELETE /api/whatsapp - delete template
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
  }

  const index = templatesStore.findIndex(t => t.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  templatesStore.splice(index, 1);
  
  return NextResponse.json({ success: true });
}
