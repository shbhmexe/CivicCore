import { NextResponse } from 'next/server';
import Retell from 'retell-sdk';

export async function POST(req: Request) {
  try {
    const { userName, issueTitle, complaintId } = await req.json();

    if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
      return NextResponse.json({ error: 'Retell API not configured' }, { status: 500 });
    }

    const retellClient = new Retell({ apiKey: process.env.RETELL_API_KEY });

    const webCallResponse = await retellClient.call.createWebCall({
      agent_id: process.env.RETELL_AGENT_ID,
      retell_llm_dynamic_variables: {
        user_name: userName || 'Citizen',
        issue_title: issueTitle || 'Civic Issue',
        complaint_id: complaintId || '',
      },
    });

    return NextResponse.json({
      access_token: webCallResponse.access_token,
      call_id: webCallResponse.call_id,
    });
  } catch (error) {
    console.error('[Retell Web Call] Error creating web call:', error);
    return NextResponse.json({ error: 'Failed to create web call' }, { status: 500 });
  }
}
