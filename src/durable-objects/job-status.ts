import { DurableObject } from 'cloudflare:workers';

export interface JobStatusState {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  processed: number;
  inserted: number;
  duplicates: number;
  errors: number;
  errorDetails: any[];
  startedAt?: string;
  completedAt?: string;
}

export class JobStatus extends DurableObject {
  private state: JobStatusState;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.state = {
      jobId: '',
      status: 'pending',
      progress: 0,
      total: 0,
      processed: 0,
      inserted: 0,
      duplicates: 0,
      errors: 0,
      errorDetails: [],
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/status') {
      return Response.json(this.state);
    }

    if (path === '/update' && request.method === 'POST') {
      const updates = await request.json();
      this.state = { ...this.state, ...updates };
      
      // Persist state to storage
      await this.ctx.storage.put('state', this.state);
      
      return Response.json({ success: true });
    }

    if (path === '/progress' && request.method === 'POST') {
      const { processed, total, inserted, duplicates, errors, errorDetail } = await request.json();
      
      this.state.processed = processed;
      this.state.total = total;
      this.state.inserted = inserted;
      this.state.duplicates = duplicates;
      this.state.errors = errors;
      this.state.progress = total > 0 ? (processed / total) * 100 : 0;
      
      if (errorDetail) {
        this.state.errorDetails.push(errorDetail);
      }

      await this.ctx.storage.put('state', this.state);
      
      return Response.json({ success: true });
    }

    if (path === '/complete' && request.method === 'POST') {
      const { status, completedAt } = await request.json();
      
      this.state.status = status;
      this.state.completedAt = completedAt;
      this.state.progress = 100;
      
      await this.ctx.storage.put('state', this.state);
      
      return Response.json({ success: true });
    }

    return new Response('Not found', { status: 404 });
  }

  async alarm(): Promise<void> {
    // Handle any scheduled tasks
  }
}
